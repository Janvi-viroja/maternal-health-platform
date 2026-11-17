import React, { useCallback, useEffect, useState } from 'react';
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseJsonResponse } from '../lib/http';
import type { CommunityPost, PageId } from '../types';

const POST_CATEGORIES = [
  { value: 'All', label: 'All' },
  { value: 'Experience', label: 'My Story' },
  { value: 'Question', label: 'Question' },
  { value: 'Nutrition Tip', label: 'Food Tip' },
  { value: 'Postpartum', label: 'After Birth' },
  { value: 'Milestone', label: 'Big Moment' },
];

interface CommunityPageProps {
  onNavigate: (page: PageId) => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ onNavigate }) => {
  const { user, apiFetch } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const [category, setCategory] = useState('Experience');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/community/posts');
      const data = await parseJsonResponse<{ posts?: CommunityPost[] }>(res);
      setPosts(data.posts || []);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to load community posts.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Please sign in to share a post with the community.');
      return;
    }
    if (title.trim().length < 4 || content.trim().length < 10) {
      setErrorMsg('Please write a clear title and message.');
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const data = await apiFetch<{ post: CommunityPost }>('/api/community/posts', {
        method: 'POST',
        body: JSON.stringify({
          category,
          title: title.trim(),
          content: content.trim(),
        }),
      });
      setPosts((prev) => [data.post, ...prev]);
      setTitle('');
      setContent('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to publish post.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
      });
      const data = await parseJsonResponse<{ post?: { likesCount: number } }>(res);
      if (data.post) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likesCount: data.post!.likesCount } : p
          )
        );
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update helpful vote.');
    }
  };

  const handleDeletePost = async (postId: number) => {
    setErrorMsg(null);
    try {
      await apiFetch(`/api/community/posts/${postId}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to delete post.');
    }
  };

  const handleComment = async (postId: number) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!user) {
      setErrorMsg('Please sign in to comment on discussions.');
      return;
    }
    if (!text) return;
    try {
      const data = await apiFetch<{ comment: CommunityPost['comments'][number] }>(
        `/api/community/posts/${postId}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ content: text }),
        }
      );
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [...p.comments, data.comment] } : p
        )
      );
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to post comment.');
    }
  };

  const visible = posts.filter((p) => filter === 'All' || p.category === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[#8E2F4C]">
            Kind Mothers Helping Each Other
          </p>
          <h1 className="text-3xl font-semibold text-[#231B24]">
            Moms Support Group
          </h1>
          <p className="text-sm text-[#5E4E5E]">
            Share your story, ask questions, swap easy food tips, and cheer on other moms.
          </p>
        </div>

        {!user && (
          <button
            type="button"
            onClick={() => onNavigate('auth')}
            className="px-4 py-2 rounded-xl bg-[#6E56A3] text-white text-xs font-semibold hover:bg-[#59438B] whitespace-nowrap cursor-pointer"
          >
            Sign In to Write or Reply
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Composer */}
        <form
          onSubmit={handlePublish}
          className="lg:col-span-4 rounded-3xl bg-white border border-[#EDE1E5] p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-[#231B24]">Write a Post</h2>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              Topic
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] bg-white text-sm"
            >
              {POST_CATEGORIES.filter((c) => c.value !== 'All').map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              Post Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Easy stretches that helped my back pain"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B24] mb-1.5">
              Your Story or Question *
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what helped you or ask other moms..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFCED4] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !user}
            className="w-full py-2.5 px-4 rounded-xl bg-[#B84A6A] text-white text-sm font-semibold hover:bg-[#9F3A58] transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post to Group'}
          </button>
        </form>

        {/* Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-[#FDF8F6] border border-[#EDE1E5]">
            {POST_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFilter(cat.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  filter === cat.value
                    ? 'bg-white text-[#231B24] shadow-xs'
                    : 'text-[#6E5C6B] hover:text-[#231B24]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-3xl bg-[#FDF8F6] border border-[#EDE1E5] animate-pulse"
                />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#FDF8F6] border border-[#EDE1E5] text-center">
              <p className="text-sm font-semibold text-[#231B24]">
                No posts in this topic yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visible.map((post) => {
                const isOpen = expandedPostId === post.id;
                return (
                  <article
                    key={post.id}
                    className="rounded-3xl bg-white border border-[#EDE1E5] p-6 space-y-4"
                  >
                    <div className="space-y-1.5">
                      <p className="text-xs text-[#6E5C6B]">
                        {post.category} · {post.authorName}
                        {post.authorWeek ? ` · Week ${post.authorWeek}` : ''}
                      </p>
                      <h3 className="text-lg font-semibold text-[#231B24]">
                        {post.title}
                      </h3>
                    </div>

                    <p className="text-sm text-[#4A3B4B] leading-relaxed">
                      {post.content}
                    </p>

                    <div className="pt-3 border-t border-[#EDE1E5] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-5">
                        <button
                          type="button"
                          onClick={() => void handleLike(post.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E2F4C] hover:opacity-80 tabular-nums cursor-pointer"
                        >
                          <Heart className="w-4 h-4" />
                          <span>{post.likesCount} Helpful</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPostId(isOpen ? null : post.id)
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B4490] hover:opacity-80 tabular-nums cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments.length} Comments</span>
                        </button>
                      </div>

                      {user && (user.id === post.userId || user.role === 'admin') && (
                        <button
                          type="button"
                          onClick={() => void handleDeletePost(post.id)}
                          aria-label={`Delete post ${post.title}`}
                          className="inline-flex items-center gap-1 text-xs text-[#7A6879] hover:text-[#B91C1C] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>

                    {isOpen && (
                      <div className="pt-3 border-t border-[#EDE1E5] space-y-3">
                        {post.comments.length === 0 ? (
                          <p className="text-xs text-[#7A6879]">
                            No replies yet. Be the first to share encouragement!
                          </p>
                        ) : (
                          <div className="space-y-2.5">
                            {post.comments.map((c) => (
                              <div
                                key={c.id}
                                className="p-3 rounded-xl bg-[#FDF8F6] border border-[#EDE1E5] space-y-1"
                              >
                                <p className="text-xs font-semibold text-[#231B24]">
                                  {c.authorName}
                                </p>
                                <p className="text-xs text-[#4A3B4B] leading-relaxed">
                                  {c.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {user && (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={commentDrafts[post.id] || ''}
                              onChange={(e) =>
                                setCommentDrafts((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              placeholder="Write a kind reply..."
                              className="flex-1 px-3 py-2 rounded-xl border border-[#DFCED4] text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => void handleComment(post.id)}
                              className="px-3 py-2 rounded-xl bg-[#6E56A3] text-white text-xs font-semibold hover:bg-[#59438B] flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Reply
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
