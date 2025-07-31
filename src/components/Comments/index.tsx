import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import styles from './Comments.module.css';
import { format } from 'date-fns';
import type { CommentSelection } from '../../types';

const Comments: React.FC = () => {
  const { comments, addComment, newCommentSelection, setNewCommentSelection, chartPins, chartIntervals } = useAppStore();
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
        {(chartPins.length > 0 || chartIntervals.length > 0) && (
          <div className={styles.selectionsPreview}>
            <h4>Selected Chart Elements (will be saved with comment):</h4>
            {chartPins.map(pin => (
              <div key={pin.id} className={styles.previewItem}>
                📍 Pin: {format(pin.timestamp, 'yyyy-MM-dd HH:mm:ss')} - {pin.power.toFixed(2)} kW
              </div>
            ))}
            {chartIntervals.map(interval => (
              <div key={interval.id} className={styles.previewItem}>
                📊 Interval: {format(interval.startTimestamp, 'MMM d HH:mm')} - {format(interval.endTimestamp, 'MMM d HH:mm')}
              </div>
            ))}
          </div>
        )}
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
              
              {(comment.pins && comment.pins.length > 0) && (
                <div className={styles.commentSelections}>
                  <h5>Chart Pins:</h5>
                  {comment.pins.map(pin => (
                    <div key={pin.id} className={styles.selectionDetail}>
                      📍 {format(pin.timestamp, 'yyyy-MM-dd HH:mm:ss')} - Power: {pin.power.toFixed(2)} kW, Wind: {pin.windSpeed.toFixed(2)} m/s
                      {pin.expectedPower && `, Expected: ${pin.expectedPower.toFixed(2)} kW`}
                    </div>
                  ))}
                </div>
              )}
              
              {(comment.intervals && comment.intervals.length > 0) && (
                <div className={styles.commentSelections}>
                  <h5>Chart Intervals:</h5>
                  {comment.intervals.map(interval => (
                    <div key={interval.id} className={styles.selectionDetail}>
                      📊 {format(interval.startTimestamp, 'MMM d HH:mm')} - {format(interval.endTimestamp, 'MMM d HH:mm')} 
                      ({Math.round((interval.endTimestamp.getTime() - interval.startTimestamp.getTime()) / (1000 * 60))} min)
                    </div>
                  ))}
                </div>
              )}
              
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