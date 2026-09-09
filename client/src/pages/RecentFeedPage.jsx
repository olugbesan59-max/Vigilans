import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import { 
  Sparkles, Heart, MessageSquare, Image as ImageIcon, 
  Send, Trash2
} from 'lucide-react';

export default function RecentFeedPage() {
  const { user, isOwner, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const data = await api.getFeed();
      setPosts(data || []);
    } catch (err) {
      addToast('Failed to load company feed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setSubmitting(true);
    try {
      const created = await api.createPost({
        content: newPostContent.trim(),
        mediaUrl: newPostMedia.trim() || undefined
      });
      setPosts(prev => [created, ...prev]);
      setNewPostContent('');
      setNewPostMedia('');
      setShowMediaInput(false);
      addToast('Update posted to team feed!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to publish post', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    if (!postId) return;

    // 1. Optimistic UI update: toggle like state instantly without wait or disappearing
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;

      const currentLiked = Boolean(p.has_liked || (Array.isArray(p.likes) && p.likes.includes(user?.id)));
      const nextLiked = !currentLiked;
      const currentCount = p.likes_count !== undefined 
        ? p.likes_count 
        : (Array.isArray(p.likes) ? p.likes.length : 0);
      const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
      
      let nextLikes = Array.isArray(p.likes) ? [...p.likes] : [];
      if (user?.id) {
        if (nextLiked && !nextLikes.includes(user.id)) {
          nextLikes.push(user.id);
        } else if (!nextLiked) {
          nextLikes = nextLikes.filter(id => id !== user.id);
        }
      }

      return {
        ...p,
        has_liked: nextLiked,
        likes_count: nextCount,
        likes: nextLikes,
      };
    }));

    // 2. Server persistence
    try {
      const res = await api.likePost(postId);
      if (res) {
        setPosts(prev => prev.map(p => {
          if (p.id !== postId) return p;
          const fullPost = res.post || (res.content ? res : null);
          if (fullPost && fullPost.id) {
            return {
              ...p,
              ...fullPost,
              authorName: fullPost.author_name || p.authorName,
              authorAvatar: fullPost.author_avatar || p.authorAvatar,
              authorRole: fullPost.author_role || p.authorRole,
              has_liked: fullPost.has_liked,
              likes_count: fullPost.likes_count,
              likes: fullPost.likes || p.likes,
            };
          }
          return {
            ...p,
            has_liked: res.has_liked !== undefined ? res.has_liked : p.has_liked,
            likes_count: res.likes_count !== undefined ? res.likes_count : p.likes_count,
            likes: res.likes || p.likes,
          };
        }));
      }
    } catch (err) {
      console.error('Like toggle failed:', err);
      // Revert if API failed
      fetchFeed();
    }
  };

  const handleAddComment = async (postId, e) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    const trimmedText = commentText.trim();
    const tempCommentId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempCommentId,
      post_id: postId,
      author_id: user?.id,
      content: trimmedText,
      authorName: user?.fullName || 'You',
      author_name: user?.fullName || 'You',
      authorAvatar: user?.avatar,
      author_avatar: user?.avatar,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // 1. Optimistically append comment and open comments list immediately
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const currentComments = Array.isArray(p.comments) ? p.comments : [];
      return {
        ...p,
        comments: [...currentComments, optimisticComment]
      };
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setExpandedComments(prev => ({ ...prev, [postId]: true }));

    // 2. Server persistence
    try {
      const res = await api.commentPost(postId, { content: trimmedText });
      const newComment = res?.comment || (res?.content ? res : null);

      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const currentComments = Array.isArray(p.comments) ? p.comments : [];
        const updatedComments = currentComments.map(c => 
          c.id === tempCommentId ? { ...c, ...(newComment || {}), id: newComment?.id || c.id } : c
        );
        return {
          ...p,
          comments: updatedComments
        };
      }));
      addToast('Comment posted', 'success');
    } catch (err) {
      console.error('Comment failed:', err);
      // Remove failed optimistic comment
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: (p.comments || []).filter(c => c.id !== tempCommentId)
        };
      }));
      addToast('Failed to add comment', 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      addToast('Post removed', 'success');
    } catch (err) {
      addToast('Failed to delete post', 'error');
    }
  };

  const toggleCommentsView = (postId) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          Company Feed & Social
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Internal social network for company announcements, celebrations, team wins, and discussions.
        </p>
      </div>

      {/* Composer Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <img
            src={user?.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100`}
            alt={user?.fullName}
            className="w-10 h-10 rounded-full object-cover border border-slate-700 mt-1"
          />
          <div className="flex-1">
            <textarea
              rows="3"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={`Share an update or celebrate a teammate, ${user?.fullName?.split(' ')[0] || 'there'}...`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />

            {showMediaInput && (
              <div className="mt-2">
                <input
                  type="url"
                  value={newPostMedia}
                  onChange={(e) => setNewPostMedia(e.target.value)}
                  placeholder="Paste image/photo URL (https://images.unsplash.com/...)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMediaInput(!showMediaInput)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${
                    showMediaInput ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Photo / Media</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition active:scale-95 flex items-center gap-1.5"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Stream */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading company timeline...</div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
          No posts yet. Be the first to share an update with the team!
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => {
            if (!post || !post.id) return null;

            const isAuthor = (post.authorId && post.authorId === user?.id) || (post.author_id && post.author_id === user?.id);
            const canDelete = isAuthor || isOwner || isAdmin;
            const isLiked = Boolean(post.has_liked || (Array.isArray(post.likes) && user?.id && post.likes.includes(user.id)));
            const likesCount = post.likes_count !== undefined 
              ? post.likes_count 
              : (Array.isArray(post.likes) ? post.likes.length : 0);
            const commentsList = Array.isArray(post.comments) ? post.comments : [];
            const isCommentsOpen = Boolean(expandedComments[post.id]);

            const authorName = post.authorName || post.author_name || 'Team Member';
            const authorAvatar = post.authorAvatar || post.author_avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100`;
            const authorRoleTitle = post.authorRoleTitle || post.author_role_title || post.author_role || 'Staff';
            const timestamp = post.timestamp || post.created_at;

            return (
              <div
                key={post.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700/80 transition"
              >
                {/* Author Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={authorAvatar}
                      alt={authorName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {authorName}
                        {(post.authorRole === 'owner' || post.author_role === 'owner') && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase">Owner</span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {authorRoleTitle} • {timestamp ? new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </p>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                      title="Delete post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <p className="mt-3 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>

                {/* Media Image */}
                {(post.mediaUrl || post.media_url) && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 max-h-96">
                    <img
                      src={post.mediaUrl || post.media_url}
                      alt="Post attachment"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Post Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post.id)}
                      className={`inline-flex items-center gap-1.5 transition ${
                        isLiked ? 'text-rose-500 font-semibold' : 'hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCommentsView(post.id)}
                      className="inline-flex items-center gap-1.5 hover:text-indigo-400 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{commentsList.length} {commentsList.length === 1 ? 'Comment' : 'Comments'}</span>
                    </button>
                  </div>
                </div>

                {/* Comment Thread (Expandable) */}
                {isCommentsOpen && (
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
                    {/* Existing comments */}
                    {commentsList.length === 0 ? (
                      <div className="text-[11px] text-slate-500 italic py-1">
                        No comments yet. Be the first to reply!
                      </div>
                    ) : (
                      commentsList.map((c) => {
                        const cAuthorName = c.authorName || c.author_name || 'Team Member';
                        const cAvatar = c.authorAvatar || c.author_avatar;
                        const cTime = c.timestamp || c.created_at;

                        return (
                          <div key={c.id || Math.random()} className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-xs">
                            {cAvatar ? (
                              <img 
                                src={cAvatar} 
                                alt={cAuthorName} 
                                className="w-6 h-6 rounded-full object-cover border border-slate-700 flex-shrink-0" 
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">
                                {cAuthorName ? cAuthorName.charAt(0) : 'U'}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-white">{cAuthorName}</span>
                                <span className="text-[10px] text-slate-500">
                                  {cTime ? new Date(cTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <p className="text-slate-300 mt-0.5">{c.content}</p>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Add comment input */}
                    <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Write a supportive reply..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={!commentInputs[post.id]?.trim()}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Reply</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
