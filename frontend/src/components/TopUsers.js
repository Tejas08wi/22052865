import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Box, Avatar } from '@mui/material';
import axios from 'axios';

const API_URL = 'http://localhost:5001';

const TopUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/top`);
        setUsers(response.data.users);
      } catch (error) {
        console.error('Error fetching top users:', error);
      }
    };

    fetchTopUsers();
    const interval = setInterval(fetchTopUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Top Users
      </Typography>
      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user._id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${user._id}`}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {user.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {user.email}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Posts: {user.postCount || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Likes: {user.totalLikes || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Comments: {user.totalComments || 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TopUsers;
