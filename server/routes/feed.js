import express from 'express';
import { db } from '../db/database.js';
import { getAuthContext } from '../middleware/auth.js';

const router = express.Router();

function getEnrichedPost(postId, currentUserId) {
  const post = db.findById('feed_posts', postId);
  if (!post) return null;

  const author = db.findById('users', post.author_id);
  const comments = db.find('feed_comments', c => c.post_id === post.id)
    .map(c => {
      const commentAuthor = db.findById('users', c.author_id);
      return {
        ...c,
        author_name: commentAuthor ? `${commentAuthor.first_name} ${commentAuthor.last_name}` : 'Team Member',
        author_role: commentAuthor ? commentAuthor.role_title : 'Staff',
        author_avatar: commentAuthor ? commentAuthor.profile_picture : '',
        authorName: commentAuthor ? `${commentAuthor.first_name} ${commentAuthor.last_name}` : 'Team Member',
        authorAvatar: commentAuthor ? commentAuthor.profile_picture : '',
        timestamp: c.created_at,
      };
    });

  const likes = Array.isArray(post.likes) ? post.likes : [];
  const authorName = author ? `${author.first_name} ${author.last_name}` : 'Unknown Author';
  const authorAvatar = author ? author.profile_picture : '';
  const authorRole = author ? author.role_title : 'Staff';

  return {
    ...post,
    author_name: authorName,
    authorName,
    author_role: authorRole,
    authorRole,
    author_avatar: authorAvatar,
    authorAvatar,
    likes,
    likes_count: likes.length,
    has_liked: currentUserId ? likes.includes(currentUserId) : false,
    comments,
    is_my_post: currentUserId ? post.author_id === currentUserId : false,
    can_delete: currentUserId ? (post.author_id === currentUserId || db.findById('users', currentUserId)?.system_role !== 'staff') : false,
    timestamp: post.created_at,
  };
}

// 1. Get recent feed posts with comments and like counts
router.get('/', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const posts = db.find('feed_posts', p => p.workspace_id === ctx.workspace.id);
  const enriched = posts
    .map(p => getEnrichedPost(p.id, ctx.user.id))
    .filter(Boolean);

  enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(enriched);
});

// 2. Create Feed Post
router.post('/', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { content, media_url, media_type } = req.body;
  if (!content && !media_url) {
    return res.status(400).json({ error: 'Post must contain text content or media.' });
  }

  const newPost = db.insert('feed_posts', {
    workspace_id: ctx.workspace.id,
    author_id: ctx.user.id,
    content: content || '',
    media_url: media_url || null,
    media_type: media_type || (media_url ? 'image' : null),
    likes: [],
  });

  const enriched = getEnrichedPost(newPost.id, ctx.user.id);
  res.status(201).json(enriched);
});

// 3. Toggle Like on Post
router.post('/:id/like', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const post = db.findById('feed_posts', req.params.id);
  if (!post || post.workspace_id !== ctx.workspace.id) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  let likes = Array.isArray(post.likes) ? [...post.likes] : [];
  const alreadyLiked = likes.includes(ctx.user.id);

  if (alreadyLiked) {
    likes = likes.filter(id => id !== ctx.user.id);
  } else {
    likes.push(ctx.user.id);
  }

  db.update('feed_posts', post.id, { likes });

  const enriched = getEnrichedPost(post.id, ctx.user.id);
  res.json({
    post: enriched,
    likes_count: likes.length,
    has_liked: !alreadyLiked,
    likes,
    ...enriched,
  });
});

// 4. Add Comment to Post
const handleAddComment = (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty.' });
  }

  const post = db.findById('feed_posts', req.params.id);
  if (!post || post.workspace_id !== ctx.workspace.id) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const comment = db.insert('feed_comments', {
    post_id: post.id,
    author_id: ctx.user.id,
    content: content.trim(),
  });

  const enrichedComment = {
    ...comment,
    author_name: `${ctx.user.first_name} ${ctx.user.last_name}`,
    author_role: ctx.user.role_title,
    author_avatar: ctx.user.profile_picture,
    authorName: `${ctx.user.first_name} ${ctx.user.last_name}`,
    authorAvatar: ctx.user.profile_picture,
    timestamp: comment.created_at,
  };

  const enrichedPost = getEnrichedPost(post.id, ctx.user.id);

  res.status(201).json({
    comment: enrichedComment,
    post: enrichedPost,
    ...enrichedComment,
  });
};

router.post('/:id/comments', handleAddComment);
router.post('/:id/comment', handleAddComment);

// 5. Delete Post (Author or Admin moderation)
router.delete('/:id', (req, res) => {
  const ctx = getAuthContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  const post = db.findById('feed_posts', req.params.id);
  if (!post || post.workspace_id !== ctx.workspace.id) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  if (post.author_id !== ctx.user.id && ctx.user.system_role === 'staff') {
    return res.status(403).json({ error: 'Permission denied. You can only delete your own posts.' });
  }

  db.delete('feed_posts', post.id);
  res.json({ message: 'Post removed successfully.' });
});

export default router;
