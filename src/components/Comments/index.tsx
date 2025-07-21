import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import styles from './Comments.module.css';
import { format } from 'date-fns';
import type { CommentSelection } from '../../types';

const Comments: React.FC = () => {
  const { comments, addComment, newCommentSelection, setNewCommentSelection } = useAppStore();
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    // Metin kutusunun boş olup olmadığını kontrol et
    if (!commentText.trim()) return;

    // Yeni yorum nesnesini o anki state ile oluştur
    const newComment = {
      id: Date.now(),
      text: commentText,
      selection: newCommentSelection, // Mağazada (store) bulunan güncel seçimi kullan
      createdAt: new Date(),
    };

    // Yorumu mağazaya ekle
    addComment(newComment);

    // Formu ve state'i sıfırla
    setCommentText('');
    setNewCommentSelection(null); 
  };
  
  const formatSelection = (selection: CommentSelection | null): string => {
    // Seçim null ise veya başlangıç değeri yoksa "Genel Yorum" olarak etiketle
    if (!selection || !selection.start) {
      return 'Genel Yorum';
    }
    
    const startDate = new Date(selection.start);
    const startFormatted = isNaN(startDate.getTime()) ? 'Invalid Date' : format(startDate, 'yyyy-MM-dd HH:mm:ss');
  
    // Bitiş değeri varsa ve başlangıçtan farklıysa bunu bir aralık olarak formatla
    if (selection.end && selection.end !== selection.start) {
      const endDate = new Date(selection.end);
      const endFormatted = isNaN(endDate.getTime()) ? 'Invalid Date' : format(endDate, 'yyyy-MM-dd HH:mm:ss');
      return `Aralık: ${startFormatted} - ${endFormatted}`;
    }
    
    // Diğer tüm durumlar (sadece başlangıç var veya başlangıç bitişe eşit) nokta seçimidir
    return `Nokta: ${startFormatted}`;
  };

  const getSelectionInfoText = () => {
      if (newCommentSelection) {
          return `Seçim: ${formatSelection(newCommentSelection)}`;
      }
      return "Genel bir yorum ekleniyor. Yorumu grafiğe bağlamak için bir nokta veya aralık seçin.";
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Analist Yorumları</h3>
      
      <div className={styles.addCommentSection}>
        <div className={styles.selectionInfo}>
            {getSelectionInfoText()}
        </div>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Yorumunuzu yazın..."
          className={styles.textarea}
          disabled={false} 
        />
        <button
          onClick={handleAddComment}
          className={styles.button}
          disabled={!commentText.trim()}
        >
          Yorum Ekle
        </button>
      </div>

      <div className={styles.commentList}>
        {comments.length === 0 ? (
          <p className={styles.noComments}>Henüz yorum yok.</p>
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