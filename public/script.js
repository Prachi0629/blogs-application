document.addEventListener('DOMContentLoaded', () => {
  const blogId = document.body.dataset.blogId;
  if (!blogId) return;

  fetchLikes(blogId);
  fetchComments(blogId);

  document.getElementById('like-btn').addEventListener('click', () => {
    fetch('/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogId })
    })
    .then(res => {
      if (res.status === 401) {
        alert('You must be logged in to like!');
        return;
      }
      return fetchLikes(blogId);
    });
  });

  document.getElementById('comment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const commentText = document.getElementById('comment').value.trim();
    if (!commentText) return;

    fetch('/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogId, text: commentText })
    })
    .then(res => {
      if (res.status === 401) {
        alert('You must be logged in to comment!');
        return;
      }
      document.getElementById('comment').value = '';
      return fetchComments(blogId);
    });
  });
});

function fetchLikes(blogId) {
  fetch(`/likes/${blogId}`)
    .then(res => res.json())
    .then(data => {
      const likeCountSpan = document.getElementById('like-count');
      likeCountSpan.textContent = data.count;
    });
}

function fetchComments(blogId) {
  fetch(`/comments/${blogId}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('comments-container');
      container.innerHTML = '';
      data.forEach(comment => {
        const div = document.createElement('div');
        div.className = 'comments-list';
        div.innerHTML = `
          <strong>${comment.username}</strong>: ${comment.text}
          ${comment.canDelete ? `<button onclick="deleteComment(${comment.id})">🗑️</button>` : ''}
        `;
        container.appendChild(div);
      });
    });
}

function deleteComment(commentId) {
  fetch(`/comment/${commentId}`, {
    method: 'DELETE'
  })
  .then(res => {
    if (res.status === 403) {
      alert("You can only delete your own comments!");
      return;
    }
    if (res.status === 200) {
      const blogId = document.body.dataset.blogId;
      fetchComments(blogId);
    }
  });
}