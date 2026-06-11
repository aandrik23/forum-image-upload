package handlers

import (
	"crypto/rand"
	"encoding/hex"
	authutils "forum/internal/authUtils"
	"forum/internal/database"
	"forum/internal/models"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func randomFileName(ext string) (string, error) {
	bytes := make([]byte, 16)

	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return hex.EncodeToString(bytes) + ext, nil
}

func CreateHandler(w http.ResponseWriter, r *http.Request) {

	payload := authutils.GetJWTFromContext(r.Context())

	if r.Method == http.MethodGet {
		// ✅ Load categories from DB
		categories, err := database.GetAllCategories()
		if err != nil {
			http.Error(w, "Unable to load categories", http.StatusInternalServerError)
			return
		}

		renderTemplate(w, "post_detail", map[string]any{
			"Categories": categories,
			"User":       payload.Username, // or payload.UserID / payload.Username depending on your base.html
		})
		return
	}

	if r.Method == http.MethodPost {
		const maxImageSize = 20 << 20 // 20 MB
		er := r.ParseMultipartForm(maxImageSize)

		// payload := authutils.GetJWTFromContext(r.Context())

		if er != nil {
			http.Error(w, "Invalid Data", http.StatusBadRequest)
			return
		}
		title := strings.TrimSpace(r.FormValue("title"))
		content := strings.TrimSpace(r.FormValue("content"))
		categoryIDs := r.Form["categories"]
		author := payload.UserID // Implement based on your session

		if title == "" || content == "" {
			http.Error(w, "Missing fields", http.StatusBadRequest)
			return
		}

		var imagePath string
		file, header, err := r.FormFile("image")
		if err != nil && err != http.ErrMissingFile {
			http.Error(w, "Error reading image", http.StatusBadRequest)
			return
		}

		if err == nil {
			defer file.Close()

			const maxImageSize = 20 << 20 // 20 MB

			if header.Size > maxImageSize {
				http.Error(w, "Image is too large. Maximum size is 20MB.", http.StatusBadRequest)
				return
			}

			buffer := make([]byte, 512)

			n, err := file.Read(buffer)
			if err != nil {
				http.Error(w, "Could not read image", http.StatusBadRequest)
				return
			}

			contentType := http.DetectContentType(buffer[:n])

			allowedTypes := map[string]string{
				"image/jpeg": ".jpg",
				"image/png":  ".png",
				"image/gif":  ".gif",
			}

			ext, ok := allowedTypes[contentType]
			if !ok {
				http.Error(w, "Invalid image type. Only JPEG, PNG and GIF are allowed.", http.StatusBadRequest)
				return
			}

			_, err = file.Seek(0, 0)
			if err != nil {
				http.Error(w, "Could not process image", http.StatusInternalServerError)
				return
			}

			uploadDir := "static/uploads"

			err = os.MkdirAll(uploadDir, os.ModePerm)
			if err != nil {
				http.Error(w, "Could not create upload directory", http.StatusInternalServerError)
				return
			}

			safeFileName, err := randomFileName(ext)
			if err != nil {
				http.Error(w, "Could not generate image filename", http.StatusInternalServerError)
				return
			}

			filePath := filepath.Join(uploadDir, safeFileName)

			dst, err := os.Create(filePath)
			if err != nil {
				http.Error(w, "Could not save image", http.StatusInternalServerError)
				return
			}
			defer dst.Close()

			_, err = io.Copy(dst, file)
			if err != nil {
				http.Error(w, "Could not save image", http.StatusInternalServerError)
				return
			}

			imagePath = "/" + filePath
		}
		// Convert []string to []models.Category
		var categories []models.Category
		for _, idStr := range categoryIDs {
			id, err := strconv.Atoi(idStr)
			if err != nil {
				http.Error(w, "Invalid category ID", http.StatusBadRequest)
				return
			}
			categories = append(categories, models.Category{ID: id})
		}

		post := models.Post{
			Title:      title,
			Content:    content,
			ImagePath:  imagePath,
			Categories: categories,
			AuthorID:   author,
			CreatedAt:  time.Now(),
		}

		err = database.InsertPostWithCategories(post)

		if err != nil {
			http.Error(w, "Failed to save post: "+err.Error(), http.StatusInternalServerError)

			return
		}

		http.Redirect(w, r, "/", http.StatusSeeOther)

	}

}
