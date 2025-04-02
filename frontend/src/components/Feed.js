import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box, 
  CardMedia, 
  TextField, 
  Button,
  IconButton,
  Avatar,
  CardActions
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';

const API_URL = 'http://localhost:5001';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState('');
  const [commentingOn, setCommentingOn] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${API_URL}/posts?type=latest`);
        setPosts(response.data.posts);
      } catch (error) {
        console.error('Error fetching feed:', error);
      }
    };

    fetchPosts();
    const interval = setInterval(fetchPosts, 10000); // More frequent updates for feed
    return () => clearInterval(interval);
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/posts`, {
        content: newPost
      });
      setPosts(prevPosts => [response.data, ...prevPosts]);
      setNewPost('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/like`);
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? response.data : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId) => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/posts/${postId}/comments`, {
        content: newComment
      });
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === postId ? response.data : post
        )
      );
      setNewComment('');
      setCommentingOn(null);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Latest Posts
      </Typography>

      {/* Create Post Form */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box component="form" onSubmit={handleCreatePost}>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              endIcon={<SendIcon />}
              disabled={!newPost.trim()}
            >
              Post
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Grid container spacing={3}>
        {posts.map((post) => (
          <Grid item xs={12} key={post._id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${post.user?._id || 'default'}`}
                    sx={{ width: 40, height: 40, mr: 2 }}
                  />
                  <Typography variant="h6">
                    {post.user?.name || 'Anonymous'}
                  </Typography>
                </Box>
                <CardMedia
                  component="img"
                  height="300"
                  image={`https://picsum.photos/seed/${post._id}/800/600`}
                  alt="Post image"
                  sx={{ borderRadius: 1, mb: 2 }}
                />
                <Typography variant="body1" paragraph>
                  {post.content}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {post.comments?.length || 0} comments • {post.likes || 0} likes
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton onClick={() => handleLike(post._id)} color="primary">
                  <FavoriteIcon />
                </IconButton>
                <IconButton onClick={() => setCommentingOn(post._id)} color="primary">
                  <CommentIcon />
                </IconButton>
              </CardActions>
              
              {/* Comment Form */}
              {commentingOn === post._id && (
                <CardContent>
                  <Box display="flex" gap={1}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleComment(post._id)}
                      disabled={!newComment.trim()}
                    >
                      Send
                    </Button>
                  </Box>
                </CardContent>
              )}

              {/* Comments List */}
              {post.comments?.length > 0 && (
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Comments
                  </Typography>
                  {post.comments.slice(-3).map((comment, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        {comment.content}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Feed;
