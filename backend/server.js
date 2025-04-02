const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5001;

// Import models
const User = require('./models/User');
const Post = require('./models/Post');

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://shashankbharatshah:GBKOK4bjumnrsbwI@cluster0.gvidb9g.mongodb.net/social_media', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB Atlas');
  
  // Create default user if it doesn't exist
  try {
    const defaultUser = await User.findOne({ name: 'Demo User' });
    if (!defaultUser) {
      const newUser = new User({
        name: 'Demo User',
        email: 'demo@example.com'
      });
      await newUser.save();
      console.log('Created default user');
    }
  } catch (error) {
    console.error('Error creating default user:', error);
  }
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Get posts with type filter (latest/popular/trending)
app.get('/posts', async (req, res) => {
  try {
    const { type = 'latest' } = req.query;
    let posts;
    
    if (type === 'popular') {
      posts = await Post.find()
        .populate('user')
        .sort({ likes: -1, 'comments.length': -1 })
        .limit(10);
    } else if (type === 'trending') {
      // Get the post with maximum comments from feed posts
      posts = await Post.find()
        .populate('user')
        .sort({ 'comments.length': -1 })
        .limit(1);
    } else {
      // Latest feed posts
      posts = await Post.find()
        .populate('user')
        .sort({ createdAt: -1 })
        .limit(20);
    }
    
    res.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Error fetching posts' });
  }
});

// Create a new post
app.post('/posts', async (req, res) => {
  try {
    const { content } = req.body;
    
    // Get the default user
    const defaultUser = await User.findOne({ name: 'Demo User' });
    if (!defaultUser) {
      return res.status(404).json({ error: 'Default user not found' });
    }

    const post = new Post({
      content,
      user: defaultUser._id,
      likes: 0,
      comments: []
    });

    await post.save();
    await post.populate('user');
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Error creating post' });
  }
});

// Like a post
app.post('/posts/:postId/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.likes = (post.likes || 0) + 1;
    await post.save();
    await post.populate('user');
    res.json(post);
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ error: 'Error liking post' });
  }
});

// Add comment to a post
app.post('/posts/:postId/comments', async (req, res) => {
  try {
    const { content } = req.body;
    const defaultUser = await User.findOne({ name: 'Demo User' });
    
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.comments.push({
      content,
      user: defaultUser._id
    });

    await post.save();
    await post.populate('user');
    res.json(post);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Error adding comment' });
  }
});

// Get feed post with maximum comments
app.get('/posts/feed/max-comments', async (req, res) => {
  try {
    const post = await Post.findOne()
      .sort({ 'comments.length': -1 }) // Sort by number of comments in descending order
      .populate('user')
      .populate('comments.user');
    
    if (!post) {
      return res.status(404).json({ error: 'No posts found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top users
app.get('/users/top', async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'user',
          as: 'posts'
        }
      },
      {
        $addFields: {
          postCount: { $size: '$posts' },
          totalLikes: { $sum: '$posts.likes' },
          totalComments: { $sum: { $size: '$posts.comments' } }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          postCount: 1,
          totalLikes: 1,
          totalComments: 1,
          score: { $add: ['$postCount', '$totalLikes', '$totalComments'] }
        }
      },
      {
        $sort: { score: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // If no users found, create some sample users
    if (users.length === 0) {
      const sampleUsers = [
        { name: 'Demo User', email: 'demo@example.com' },
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' },
        { name: 'Bob Wilson', email: 'bob@example.com' },
        { name: 'Alice Brown', email: 'alice@example.com' }
      ];

      for (const userData of sampleUsers) {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          const user = new User(userData);
          await user.save();
        }
      }

      // Fetch users again after creating samples
      const newUsers = await User.find().limit(5);
      res.json({ users: newUsers });
    } else {
      res.json({ users });
    }
  } catch (error) {
    console.error('Error fetching top users:', error);
    res.status(500).json({ error: 'Error fetching top users' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
