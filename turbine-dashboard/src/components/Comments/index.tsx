import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import styles from './Comments.module.css';
import { format } from 'date-fns';

const Comments: React.FC = () => {
  const { comments, addComment, newCommentSelection, setNewCommentSelection } = useAppStore();
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    if (!commentText.trim() || !newCommentSelection) return;

    addComment({
      id: Date.now(),
      text: commentText,
      selection: newCommentSelection,
      createdAt: new Date(),
    });

    setCommentText('');
    setNewCommentSelection(null); // Yorum eklendikten sonra seçimi temizle
  };

  const formatSelection = (selection: typeof newCommentSelection) => {
    if (!selection) return 'No selection';
    const start = format(new Date(selection.start), 'HH:mm:ss');
    if (selection.end) {
      const end = format(new Date(selection.end), 'HH:mm:ss');
      return `Range: ${start} - ${end}`;
    }
    return `Point: ${start}`;
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Analyst Comments</h3>
      
      {/* Yorum Ekleme Formu */}
      <div className={styles.addCommentSection}>
        <div className={styles.selectionInfo}>
          {newCommentSelection 
            ? `Selected Range: ${formatSelection(newCommentSelection)}`
            : "Select a point or range on the chart to add a comment."
          }
        </div>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write your comment..."
          className={styles.textarea}
          disabled={!newCommentSelection}
        />
        <button
          onClick={handleAddComment}
          className={styles.button}
          disabled={!commentText.trim() || !newCommentSelection}
        >
          Add Comment
        </button>
      </div>

      {/* Mevcut Yorumlar Listesi */}
      <div className={styles.commentList}>
        {comments.length === 0 ? (
          <p className={styles.noComments}>No comments yet.</p>
        ) : (
          [...comments].reverse().map(comment => (
            <div key={comment.id} className={styles.commentItem}>
              <p className={styles.commentText}>{comment.text}</p>
              <div className={styles.commentMeta}>
                <span>{formatSelection(comment.selection)}</span>
                <span>{format(comment.createdAt, 'MMM d, yyyy HH:mm')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;