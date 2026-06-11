// DOM Elements
const sidebar = document.querySelector(".sidebar");
const toggleBtn = document.getElementById("sidebar-toggle");
const contentWrapper = document.querySelector(".container.content");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");
const footerLoginLink = document.getElementById("footerLoginLink");
const footerRegisterLink = document.getElementById("footerRegisterLink");
const commentForm = document.getElementById('comment-form');
const navHomeBtn = document.querySelector(".navbar .home-btn");
const sidebarHomeBtns = document.querySelectorAll(".sidebar-btn.home-btn");
const profileBtn = document.querySelector(".sidebar-btn.profile-btn");
const globalCloseBtns = document.querySelectorAll(".modal-close");


// A static list of 20 seed strings you want to offer
const AVATAR_SEEDS = [
    "demo","alice","bob","carol","dave",
    "eve","frank","grace","heidi","ivan",
    "judy","mallory","nia","oscar","peggy",
    "quincy","rick","sybil","trent","victor",
];

// Helpers
function getCookie(name) {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

function openModal(modalEl) {
    modalEl?.classList.add('open');
}

function closeModal(modalEl) {
    modalEl?.classList.remove('open');
}

function redirectIfError() {

    // clicking on profile as anonymous redirect to register
    const params = new URLSearchParams(window.location.search);
    const show = params.get('show');
    if (show === 'login') {
        openModal(loginModal);
    } else if (show === 'register') {
        openModal(registerModal);
    }
}

function initImageUploadValidation() {
    const imageInput = document.getElementById("image");
    const imageError = document.getElementById("image-error");
    const fileName = document.getElementById("file-name");

    if (!imageInput) return;

    imageInput.addEventListener("change", function () {
        const file = this.files[0];

        if (!file) {
            if (fileName) fileName.textContent = "No file selected";
            return;
        }
        if (fileName) {
            fileName.textContent = file.name;
        }

        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
            if (imageError) {
                imageError.textContent = "Image is too large. Maximum size is 20MB.";
            }
            this.value = "";
            if (fileName) fileName.textContent = "No file selected";
            return;
        }
        if (imageError) imageError.textContent = "";
    });
}

function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // package up field values
    const data = new URLSearchParams(new FormData(form));
    const errorEl = form.querySelector('.form-error');
    errorEl.textContent = '';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      });

      if (res.ok) {
        // success → go to home
        window.location.href = '/home';
      } else {
        // failure → show server‐side message in modal
        const payload = await res.json();
        console.log(payload.error);
        errorEl.textContent = payload.error || 'Something went wrong';
      }
    } catch (err) {
      console.error('Network error:', err);
      errorEl.textContent = 'Network error, please try again';
    }
  });
}

function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new URLSearchParams(new FormData(form));
    const errorEl = form.querySelector('.form-error');
    errorEl.textContent = '';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      });

      if (res.ok) {
        const payload = await res.json();
        window.location.href = payload.redirect || '/home';
      } else {
        const payload = await res.json();
        errorEl.textContent = payload.error || 'Invalid credentials';
      }
    } catch (err) {
      console.error('Network error:', err);
      form.querySelector('.form-error').textContent = 'Network error, please try again';
    }
  });
}


function initLikeButtons() {
  document.querySelectorAll('.like-btn, .dislike-btn').forEach(button => {
    button.addEventListener('click', async () => {

      const targetId = button.dataset.postId;
      const targetType = button.dataset.targetType; // <-- new
      const action = button.classList.contains('like-btn') ? 'like' : 'dislike';
      const csrfToken = getCookie('csrf_token');

      try {
        const res = await fetch('/posts/react', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({
            target_type: targetType,
            target_id: parseInt(targetId),
            action
          })
        });

       redirectIfError();
        if (res.status == 403) {
            openModal(registerModal);
        }
        if (res.ok) {
         const data = await res.json(); // expect JSON with updated counts and user reaction

        // Find buttons by postId and targetType
        const likeBtn = document.querySelector(`button.like-btn[data-post-id="${targetId}"][data-target-type="${targetType}"]`);
        const dislikeBtn = document.querySelector(`button.dislike-btn[data-post-id="${targetId}"][data-target-type="${targetType}"]`);
        const commentBtn = document.querySelector(`button.comment-toggle-btn[data-post-id="${targetId}"]`);

        // Update counts
        likeBtn.querySelector('.count').textContent = data.likes;
        dislikeBtn.querySelector('.count').textContent = data.dislikes;
        commentBtn.querySelector('.count').textContent = data.numcomments;

            if (data.user_reaction === 'like') {
                likeBtn.setAttribute('data-clicked', 'true');
                dislikeBtn.setAttribute('data-clicked', 'false');
            } else if (data.user_reaction === 'dislike') {
                likeBtn.setAttribute('data-clicked', 'false');
                dislikeBtn.setAttribute('data-clicked', 'true');
            } else {
                likeBtn.setAttribute('data-clicked', 'false');
                dislikeBtn.setAttribute('data-clicked', 'false');
            }
        } else {
          console.error("Reaction failed:", await res.text());
        }
      } catch (err) {
        console.error("Network error:", err);
      }
    });
  });
}



function initFilterModal() {
    const filterModal = document.getElementById('filterModal');
    const filterBtn = document.querySelector('.filter-btn');
    const filterForm = document.getElementById('filterForm');

    if (!filterBtn || !filterModal || !filterForm) return;

    filterBtn.addEventListener('click', () => {
        console.log("Filter button clicked!");
        openModal(filterModal)
    });

    filterModal.addEventListener('click', e => {
      if (e.target === filterModal) closeModal(filterModal);
    });

    filterModal.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => closeModal(filterModal));
    });

    filterForm.addEventListener('submit', e => {
      e.preventDefault();
      const sortValue = filterForm.sort.value;
      const selectedCategories = [...filterForm.querySelectorAll('input[name="category"]:checked')]
        .map(cb => cb.value);

      const url = new URL(window.location.href);
      url.searchParams.set('sort', sortValue);
      url.searchParams.set('categories', selectedCategories.join(','));

      window.location.href = url.toString();
    });
  }



// Theme toggle (light/dark)
function initThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle");
    if (!themeToggle) return;

    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark-mode');
        themeToggle.checked = true;
    }

    themeToggle.addEventListener('change', () => {
        const isDark = themeToggle.checked;
        document.documentElement.classList.toggle('dark-mode', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// Sidebar collapse/expand
function initSidebarToggle() {
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    sidebar?.classList.toggle('collapsed', collapsed);
    contentWrapper?.classList.toggle('collapsed', collapsed);

    toggleBtn?.addEventListener('click', () => {
        const isCollapsed = sidebar.classList.toggle('collapsed');
        contentWrapper.classList.toggle('collapsed', isCollapsed);
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    });
}

// Modal wiring (login/register)
function initAuthModals() {
    loginBtn?.addEventListener('click', () => openModal(loginModal));
    registerBtn?.addEventListener('click', () => openModal(registerModal));

    // Footer links
    footerLoginLink?.addEventListener('click', e => {
        e.preventDefault();
        openModal(loginModal);
    });
    footerRegisterLink?.addEventListener('click', e => {
        e.preventDefault();
        openModal(registerModal);
    });

    // In-modal switches
    document.getElementById('showRegister')?.addEventListener('click', e => {
        e.preventDefault();
        closeModal(loginModal);
        openModal(registerModal);
    });
    document.getElementById('showLogin')?.addEventListener('click', e => {
        e.preventDefault();
        closeModal(registerModal);
        openModal(loginModal);
    });

    // Global close buttons
    globalCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            closeModal(modal);
        });
    });

    // Click outside content to close
    [loginModal, registerModal].forEach(modal => {
        modal?.addEventListener('click', e => {
            if (e.target === modal) closeModal(modal);
        });
    });

    redirectIfError();
}


// Profile modal
function initProfileModal() {
    const editBtn = document.querySelector('.profile-edit-btn');
    const editModal = document.getElementById('editProfileModal');
    const avatarSelectModal = document.getElementById('avatarSelectModal');
    if (!editBtn || !editModal || !avatarSelectModal) {
        return;
    }
    const avatarPreviewImg = document.getElementById('avatarPreviewImg');
    const avatarSeedInput = document.getElementById('edit-avatarSeed');
    let gridBuilt = false;

    // open/Edit Profile: populate inputs from page
    editBtn.addEventListener('click', () => {
        // pull from header
        const currentName = document.querySelector('.profile-username').textContent.trim();
        const currentBio  = document.querySelector('.profile-bio').textContent.trim();
        const avatarEl    = document.querySelector('.profile-avatar img');
        const avatarURL   = avatarEl.src;
        const seed        = new URL(avatarURL).searchParams.get('seed') || '';

        // set form fields
        document.getElementById('edit-username').value    = currentName;
        document.getElementById('edit-bio').value         = currentBio;
        avatarSeedInput.value                             = seed;
        avatarPreviewImg.src                              = avatarURL;

        openModal(editModal);

        // Close Edit Profile if you click the dark backdrop
        editModal.addEventListener('click', e => {
            // only fire when clicking outside the modal card
            if (e.target === editModal) {
                closeModal(editModal);
            }
        });
    });

    // build avatar grid once
    function buildAvatarGrid() {
        AVATAR_SEEDS.forEach(seed => {
            const img = document.createElement('img');
            img.src         = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
            img.dataset.seed = seed;
            img.className   = 'avatar-thumb';
            if (seed === avatarSeedInput.value) img.classList.add('selected');
            avatarGrid.appendChild(img);
        });
        gridBuilt = true;
    }

    // clicking preview → open picker
    document.querySelector('.avatar-preview').addEventListener('click', () => {
        if (!gridBuilt) buildAvatarGrid();
        openModal(avatarSelectModal);
    });

    // pick an avatar
    avatarGrid.addEventListener('click', e => {
        const thumb = e.target.closest('.avatar-thumb');
        if (!thumb) return;
        // update hidden input + preview
        avatarSeedInput.value = thumb.dataset.seed;
        avatarPreviewImg.src  = thumb.src;
        // persist selection in localStorage
        localStorage.setItem('avatarSeed', thumb.dataset.seed);
        avatarGrid.querySelectorAll('.avatar-thumb.selected')
            .forEach(el => el.classList.remove('selected'));
        thumb.classList.add('selected');
        closeModal(avatarSelectModal);
    });

    // close picker if clicking backdrop or close-btn
    avatarSelectModal.addEventListener('click', e => {
        if (e.target === avatarSelectModal) closeModal(avatarSelectModal);
    });
    avatarSelectModal.querySelectorAll('.modal-close')
        .forEach(btn => btn.addEventListener('click', () => closeModal(avatarSelectModal)));

    // save changes → swap page header
    document.getElementById('editProfileForm').addEventListener('submit', async e => {
        e.preventDefault();
        console.log("Submitting profile form..."); // <-- Add this    

        const name = document.getElementById('edit-username').value.trim();
        const bio = document.getElementById('edit-bio').value.trim();
        const avatarSeed = document.getElementById('edit-avatarSeed').value.trim();

        try {
            const csrfToken = getCookie('csrf_token');
            const res = await fetch('/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ username: name, bio, avatarSeed })
            });

            if (res.ok) {
                window.location.reload();
            } else {
                console.error("Update failed:", await res.text());
            }
        } catch (err) {
            console.error("Network error:", err);
        }
    });
}

function initProfilePostsButton() {
    const postsBtn = document.querySelector(".user-posts-link");
    if (postsBtn) {
      postsBtn.addEventListener("click", () => {
        window.location.href = "/?filter=created";
      });
    }
  }

// Navigation links
function initNavLinks() {
    navHomeBtn?.addEventListener('click', () => location.href = '/');
    sidebarHomeBtns.forEach(btn => btn.addEventListener('click', () => location.href = '/'));
    profileBtn?.addEventListener('click', () => location.href = '/profile');
}

//NEW COMMENT
function initCommentForm() {
    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', async e => {
            e.preventDefault();

            const postId = form.getAttribute('data-post-id');

            const textarea = form.querySelector('textarea');
            const content = textarea.value.trim();
            const csrfToken = getCookie('csrf_token');

            if (!content) return;

            console.log('Sending comment:', { post_id: parseInt(postId), content });


            try {
                const response = await fetch('/posts/comments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({ post_id: parseInt(postId), content })
                });

                redirectIfError();
                if (response.status == 403) {
                    openModal(registerModal);
                }
                if (response.ok) {
                    //  Add comment
                    const newComment = document.createElement('div');
                    newComment.classList.add('comment');
                    newComment.innerHTML = `
                        <p><strong>You</strong>: ${content}</p>
                        <p class="meta">just now</p>
                        <div class="actions">
                            <button data-post-id="new" data-target-type="comment" class="like-btn" data-clicked="false">
                                <span class="count">0</span>
                            </button>
                            <button data-post-id="new" data-target-type="comment" class="dislike-btn" data-clicked="false">
                                <span class="count">0</span>
                            </button>
                        </div>
                    `;
                    form.previousElementSibling.appendChild(newComment);
                    initLikeButtons();


                    // 2. Clear textarea
                    textarea.value = '';

                    // 3. Increment comment count in the toggle button
                    const commentBtn = document.querySelector(`.comment-toggle-btn[data-post-id="${postId}"] .count`);
                    if (commentBtn) {
                        const currentCount = parseInt(commentBtn.textContent, 10) || 0;
                        commentBtn.textContent = currentCount + 1;
                    }
                } else {
                    const err = await response.text();
                    console.error('Failed to post comment:', err);
                }
            } catch (err) {
                console.error('Network error:', err);
            }

            const previewForm = document.getElementById('previewCommentForm');
            if (previewForm) {
              previewForm.addEventListener('submit', async e => {
                e.preventDefault();

                const postId = previewForm.dataset.postId;
                const textarea = previewForm.querySelector('textarea');
                const content = textarea.value.trim();
                const csrfToken = getCookie('csrf_token');

                if (!content) return;

                try {
                  const response = await fetch('/posts/comments', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({ post_id: parseInt(postId), content })
                  });

                  if (response.status === 403) {
                    openModal(registerModal);
                    return;
                  }

                  if (response.ok) {
                    const newComment = document.createElement('div');
                    newComment.classList.add('comment');
                    newComment.innerHTML = `
                      <p><strong>You</strong>: ${content}</p>
                      <p class="meta">just now</p>
                      <div class="actions">
                        <button data-post-id="new" data-target-type="comment" class="like-btn" data-clicked="false">
                          <span class="count">0</span>
                        </button>
                        <button data-post-id="new" data-target-type="comment" class="dislike-btn" data-clicked="false">
                          <span class="count">0</span>
                        </button>
                      </div>
                    `;
                    document.getElementById('previewCommentsList').appendChild(newComment);
                    textarea.value = '';
                    initLikeButtons();
                  } else {
                    console.error('Error saving comment:', await response.text());
                  }
                } catch (err) {
                  console.error('Network error:', err);
                }
              });
            }



        });
    });
}


function initDeletePostModal() {
    let currentDeleteForm = null;
    const deleteModal = document.getElementById('postDeleteModal');
    const cancelBtn = document.getElementById('cancelPostDelete');
    const confirmBtn = document.getElementById('confirmPostDelete');
    const csrfToken = getCookie('csrf_token'); // Make sure this function is defined

    if (!deleteModal || !cancelBtn || !confirmBtn) return;

    // Attach listener to all delete forms
    document.querySelectorAll('.delete-form').forEach(form => {
        form.addEventListener('submit', e => {
            e.preventDefault();
            currentDeleteForm = form;
            deleteModal.classList.remove('hidden');
        });
    });

    cancelBtn.addEventListener('click', () => {
        deleteModal.classList.add('hidden');
        currentDeleteForm = null;
    });

    confirmBtn.addEventListener('click', () => {
        if (currentDeleteForm) {
            const csrfInput = currentDeleteForm.querySelector('input[name="csrf_token"]');
            if (csrfInput && csrfToken) {
                csrfInput.value = csrfToken;
            }
            currentDeleteForm.submit();
        }
    });

    // Optional: close modal when clicking outside modal content
    deleteModal.addEventListener('click', e => {
        if (e.target === deleteModal) {
            deleteModal.classList.add('hidden');
            currentDeleteForm = null;
        }
    });
}

function initPostPreviewModal() {
  const modal = document.getElementById('postPreviewModal');

  if (!modal) return;

  const titleEl = document.getElementById('previewTitle');
  const contentEl = document.getElementById('previewContent');
  const dateEl = document.getElementById('previewDate');
  const likeBtn = modal.querySelector('.like-btn');
  const dislikeBtn = modal.querySelector('.dislike-btn');
  const commentBtn = modal.querySelector('.comment-toggle-btn');


  document.querySelectorAll('.profile-post-title').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();

      const postId = link.dataset.id;
      const title = link.dataset.title;
      const content = link.dataset.content;
      const date = link.dataset.date;
      const likes = link.dataset.likes || 0;
      const dislikes = link.dataset.dislikes || 0;
      const comments = link.dataset.comments || 0;

      // Fill modal
      titleEl.textContent = title;
      dateEl.textContent = date;
      contentEl.textContent = content;
      document.getElementById('previewLikes').textContent = likes;
      document.getElementById('previewDislikes').textContent = dislikes;
      document.getElementById('previewComments').textContent = comments;

      // Button bindings
      likeBtn.dataset.postId = postId;
      likeBtn.dataset.targetType = 'post';
      dislikeBtn.dataset.postId = postId;
      dislikeBtn.dataset.targetType = 'post';
      commentBtn.dataset.postId = postId;

      likeBtn.setAttribute('data-clicked', 'false');
      dislikeBtn.setAttribute('data-clicked', 'false');

      // Reset section
      const commentsSection = document.getElementById('previewCommentsSection');
      const commentsList = document.getElementById('previewCommentsList');
      const commentForm = document.getElementById('previewCommentForm');

      commentsList.innerHTML = '';
      commentForm.dataset.postId = postId;

      // Load comments dynamically
      fetch(`/posts/${postId}/comments`)
        .then(res => res.json())
        .then(comments => {
          comments.forEach(c => {
            const commentEl = document.createElement('div');
            commentEl.classList.add('comment');
            commentEl.innerHTML = `
              <p><strong>${c.author}</strong>: ${c.content}</p>
              <p class="meta">${c.created_at}</p>
              <div class="actions">
                <button data-post-id="${c.id}" data-target-type="comment" class="like-btn" data-clicked="false">
                    <span class="count">${c.likes}</span>
                </button>
                <button data-post-id="${c.id}" data-target-type="comment" class="dislike-btn" data-clicked="false">
                    <span class="count">${c.dislikes}</span>
                </button>
              </div>
            `;
            commentsList.appendChild(commentEl);
          });
          commentsSection.classList.remove('hidden');
          initLikeButtons(); // rebind likes for comments
        })
        .catch(err => {
          console.error('Error loading comments:', err);
        });


      openModal(modal);
      initLikeButtons(); // ensure buttons work
    });
  });

   // Close modal on background click
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal(modal);
  });

	  // Close on × button
  modal.querySelector('.modal-close')?.addEventListener('click', () => {
    closeModal(modal);
  });
}


// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // on page load, restore saved avatar
    const savedSeed = localStorage.getItem('avatarSeed');
    if (savedSeed) {
        const img = document.querySelector('.profile-avatar img');
        if (img) {
            img.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(savedSeed)}`;
        }
    }
    const csrfTokenInput = document.getElementById('csrf_token_input');
    if (csrfTokenInput) {
        const csrfToken = getCookie('csrf_token');
        if (csrfToken) {
            csrfTokenInput.value = csrfToken;
        } else {
            console.warn("CSRF token missing in cookies.");
        }
    }

    function initProfilePostsRedirect() {
        const postStat = document.querySelector('.user-posts-link');
        if (postStat) {
          postStat.addEventListener('click', () => {
            window.location.href = '/?filter=created';
          });
        }
      }

      function initProfileLikesRedirect() {
        const likesStat = document.querySelector('.user-likes-link');
        if (likesStat) {
          likesStat.addEventListener('click', () => {
            window.location.href = '/?filter=liked';
          });
        }
      }
      function initProfileDislikesRedirect() {
        const dislikesStat = document.querySelector('.user-dislikes-link');
        if (dislikesStat) {
          dislikesStat.addEventListener('click', () => {
            window.location.href = '/?filter=disliked';
          });
        }
      }
      

    initLikeButtons();
    initCommentForm();
    initThemeToggle();
    initSidebarToggle();
    initAuthModals();
    initLoginForm();
    initRegisterForm(); // NEW
    initFilterModal(); // ?????????
    initProfileModal();
    initPostPreviewModal();
    initProfilePostsRedirect();
    initProfileLikesRedirect();
    initProfileDislikesRedirect();
    initNavLinks();
    initDeletePostModal();
    initImageUploadValidation();
});


    // Show/Hide Comments
document.querySelectorAll('.comment-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const postId = btn.dataset.postId;
        const section = document.getElementById(`comments-${postId}`);

        // Toggle both visibility and CSS classes
        if (section.classList.contains('show')) {
            section.classList.remove('show');
            section.classList.add('hidden');
        } else {
            section.classList.remove('hidden');
            section.classList.add('show');
        }
    });
});


//     // ——— new category–injection code ———
//     const rawCats = link.dataset.categories || '';
//     const cats    = rawCats ? rawCats.split(',') : [];
//     const catContainer = modal.querySelector('.modal-categories');

// // clear old ones
//     catContainer.innerHTML = '';

// // append only this post’s badges
//     cats.forEach(name => {
//         const span = document.createElement('span');
//         span.className   = 'badge';
//         span.textContent = name;
//         catContainer.appendChild(span);
//     });
// // ————————————————————————————————
