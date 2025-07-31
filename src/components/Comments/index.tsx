import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import styles from './Comments.module.css';
import { format } from 'date-fns';
import type { CommentSelection } from '../../types';

const Comments: React.FC = () => {
  const { comments, addComment, newCommentSelection, setNewCommentSelection } = useAppStore();
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now(),
      text: commentText,
      selection: newCommentSelection,
      createdAt: new Date(),
    };

    addComment(newComment);

    setCommentText('');
    setNewCommentSelection(null); 
  };
  
  const formatSelection = (selection: CommentSelection | null): string => {
    if (!selection || !selection.start) {
      return 'General Comment';
    }
    
    const startDate = new Date(selection.start);
    const startFormatted = isNaN(startDate.getTime()) ? 'Invalid Date' : format(startDate, 'yyyy-MM-dd HH:mm:ss');
  
    if (selection.end && selection.end !== selection.start) {
      const endDate = new Date(selection.end);
      const endFormatted = isNaN(endDate.getTime()) ? 'Invalid Date' : format(endDate, 'yyyy-MM-dd HH:mm:ss');
      return `Range: ${startFormatted} - ${endFormatted}`;
    }
    
    return `Point: ${startFormatted}`;
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Analyst Comments</h3>
      
      <div className={styles.addCommentSection}>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write your comment..."
          className={styles.textarea}
          disabled={false} 
        />
        <button
          onClick={handleAddComment}
          className={styles.button}
          disabled={!commentText.trim()}
        >
          Add Comment
        </button>
      </div>

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