(function () {
  'use strict';

  // ── Page guard ─────────────────────────────────────────────────────────────
  const container = document.querySelector('.site-detail');
  if (!container) return;

  const siteId = container.dataset.siteId;
  const currentUserId = container.dataset.userId || null;

  // ── Utilities ──────────────────────────────────────────────────────────────

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ── Review card builder ────────────────────────────────────────────────────

  function buildReviewCard(review) {
    const isOwner = !!(currentUserId && review.userId === currentUserId);

    const photosHtml = review.photoUrls.length
      ? `<div class="review-photos">${review.photoUrls
          .map(
            (url) =>
              `<img src="${escapeHtml(url)}" alt="Review photo" class="review-photo" />`
          )
          .join('')}</div>`
      : '';

    const actionsHtml = isOwner
      ? `<div class="review-actions">
           <a href="/reviews/${review._id}/edit" class="btn btn--small btn--secondary">Edit</a>
           <form method="POST" action="/reviews/${review._id}/delete"
                 class="delete-form" data-review-id="${review._id}">
             <button type="submit" class="btn btn--small btn--danger">Delete</button>
           </form>
         </div>`
      : '';

    return `
      <div class="review-card card" data-review-id="${review._id}">
        <div class="review-card__header">
          <h3 class="review-title">${escapeHtml(review.title)}</h3>
          <span class="review-date">${formatDate(review.createdAt)}</span>
        </div>
        <p class="review-author">By <strong>${escapeHtml(review.username)}</strong></p>
        <div class="review-ratings">
          <span class="rating-badge">Noise: ${review.ratings.noise}/5</span>
          <span class="rating-badge">Air: ${review.ratings.airQuality}/5</span>
          <span class="rating-badge">Size: ${review.ratings.constructionSize}/5</span>
          <span class="rating-badge">Hours: ${review.ratings.workHours}/5</span>
        </div>
        <p class="review-body">${escapeHtml(review.body)}</p>
        ${photosHtml}
       <div class="review-footer">
          <button class="like-btn${review.likedByUser ? ' like-btn--active' : ''}"
                  data-review-id="${review._id}"
                  aria-label="Like this review"
                  aria-pressed="${review.likedByUser ? 'true' : 'false'}"
                  ${currentUserId ? '' : 'disabled'}>
            ♥ <span class="like-count-val">${review.likeCount}</span>
          </button>
          ${actionsHtml}
        </div>
      </div>`;
  }

  function buildEmptyState() {
    const link = currentUserId
      ? `<a href="/reviews/new?siteId=${encodeURIComponent(siteId)}" class="btn btn--primary">Write a Review</a>`
      : `<a href="/signin" class="btn btn--secondary">Sign in to write the first review</a>`;
    return `<div class="no-reviews card">
              <p>No reviews yet. Be the first to share your experience!</p>
              ${link}
            </div>`;
  }

  // ── DOM helpers ────────────────────────────────────────────────────────────

  function getListEl() {
    return document.getElementById('review-list-container');
  }

  function updateCountDisplay(count) {
    const el = document.getElementById('review-count-display');
    if (el) el.textContent = `(${count} review${count !== 1 ? 's' : ''})`;
  }

  // Replaces the review list and re-attaches delete handlers
  function setReviewList(reviews) {
    const listEl = getListEl();
    if (!listEl) return;

    if (reviews.length === 0) {
      listEl.innerHTML = buildEmptyState();
    } else {
      listEl.innerHTML = reviews.map(buildReviewCard).join('');
      attachDeleteHandlers();
      attachLikeHandlers();
    }
  }

  // ── Sort ───────────────────────────────────────────────────────────────────

  async function handleSortChange(e) {
    const select = e.target;
    const sortBy = select.value;
    const listEl = getListEl();

    // Update URL so a refresh preserves the sort
    const url = new URL(window.location.href);
    url.searchParams.set('sort', sortBy);
    history.pushState({}, '', url.toString());

    // Show loading state
    if (listEl) listEl.classList.add('review-list--loading');
    select.disabled = true;

    try {
      const res = await fetch(
        `/api/sites/${encodeURIComponent(siteId)}/reviews?sort=${encodeURIComponent(sortBy)}`
      );
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const { reviews } = await res.json();
      setReviewList(reviews);
      updateCountDisplay(reviews.length);
    } catch (err) {
      console.error('Sort failed:', err);
      // Fall back to a normal page load so the user still gets their result
      window.location.href = url.toString();
    } finally {
      if (listEl) listEl.classList.remove('review-list--loading');
      select.disabled = false;
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(e) {
    e.preventDefault();
    if (!confirm('Delete this review?')) return;

    const form = e.currentTarget;
    const reviewId = form.dataset.reviewId;
    const card = document.querySelector(`.review-card[data-review-id="${reviewId}"]`);
    const btn = form.querySelector('button[type="submit"]');

    // Disable button to prevent double-submit
    btn.disabled = true;
    btn.textContent = 'Deleting\u2026';

    try {
      const res = await fetch(`/reviews/${encodeURIComponent(reviewId)}/delete`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }

      if (card) {
        // Animate the card out, then clean up
        card.classList.add('review-card--removing');
        card.addEventListener(
          'transitionend',
          () => {
            card.remove();
            const remaining = document.querySelectorAll('.review-card').length;
            updateCountDisplay(remaining);
            if (remaining === 0) {
              const listEl = getListEl();
              if (listEl) listEl.innerHTML = buildEmptyState();
            }
          },
          { once: true }
        );
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Could not delete the review: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  }

  function attachDeleteHandlers() {
    document.querySelectorAll('.delete-form').forEach((form) => {
      // Clone to remove any previously attached listener before re-attaching
      const fresh = form.cloneNode(true);
      form.replaceWith(fresh);
      fresh.addEventListener('submit', handleDelete);
    });
  }
  async function handleLike(e) {
  const btn = e.currentTarget;
  if (btn.disabled) return;
  const reviewId = btn.dataset.reviewId;
  btn.disabled = true;
  try {
    const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/like`, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    if (res.status === 401) { window.location.href = '/signin'; return; }
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const { liked, likeCount } = await res.json();
    const countEl = btn.querySelector('.like-count-val');
    if (countEl) countEl.textContent = likeCount;
    btn.classList.toggle('like-btn--active', liked);
    btn.setAttribute('aria-pressed', String(liked));
  } catch (err) {
    console.error('Like failed:', err);
  } finally {
    btn.disabled = false;
  }
}

function attachLikeHandlers() {
  document.querySelectorAll('.like-btn').forEach((btn) => {
    if (btn.disabled) return;
    btn.removeEventListener('click', handleLike);
    btn.addEventListener('click', handleLike);
  });
}

  // ── Init ───────────────────────────────────────────────────────────────────

  const sortSelect = document.getElementById('sort');
  if (sortSelect) sortSelect.addEventListener('change', handleSortChange);
  attachDeleteHandlers();
  attachLikeHandlers();
})();
