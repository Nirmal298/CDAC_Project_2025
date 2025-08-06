import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plane, Calendar, CreditCard, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { bookingAPI } from '@/services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingFlights: 0,
    totalSpent: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const bookingsResponse = await bookingAPI.getByUser(user?.userId || user?.id);
      const bookings = bookingsResponse.data;

      const totalBookings = bookings.length;
      const upcomingFlights = bookings.filter(
        booking =>
          new Date(booking.flightDate) > new Date() &&
          booking.status?.toLowerCase() !== 'cancelled'
      ).length;
      const totalSpent = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);

      const recentBookings = bookings
        .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
        .slice(0, 5)
        .map(booking => ({
          id: booking.bookingId,
          flightNumber: booking.flightNumber,
          from: booking.departureCity,
          to: booking.arrivalCity,
          date: booking.flightDate,
          status: booking.status?.toLowerCase(),
          amount: booking.amount
        }));

      setStats({
        totalBookings,
        upcomingFlights,
        totalSpent,
        recentBookings
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Search Flights',
      description: 'Find your next adventure',
      icon: Plane,
      link: '/flights',
      color: 'from-blue-500 to-purple-600'
    },
    {
      title: 'My Bookings',
      description: 'Manage your trips',
      icon: Calendar,
      link: '/bookings',
      color: 'from-green-500 to-teal-600'
    },
    {
      title: 'Payment History',
      description: 'View transactions',
      icon: CreditCard,
      link: '/payments',
      color: 'from-orange-500 to-red-600'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button
            onClick={fetchDashboardData}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - Flynest | Manage Your Flight Bookings</title>
        <meta
          name="description"
          content="Access your Flynest dashboard to view bookings, search flights, and manage your travel plans."
        />
      </Helmet>

      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, <span className="gradient-text">{user?.name || 'Traveler'}</span>!
            </h1>
            <p className="text-gray-300 text-lg">Ready for your next adventure?</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <Card className="glass-effect border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Bookings</p>
                    <p className="text-3xl font-bold text-white">{stats.totalBookings}</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-full">
                    <Plane className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Upcoming Flights</p>
                    <p className="text-3xl font-bold text-white">{stats.upcomingFlights}</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-full">
                    <Calendar className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Spent</p>
                    <p className="text-3xl font-bold text-white">₹{stats.totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-full">
                    <TrendingUp className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                  <CardDescription className="text-gray-400">
                    What would you like to do today?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quickActions.map((action, index) => (
                    <Link key={index} to={action.link}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-lg bg-gradient-to-r ${action.color} bg-opacity-10 border border-white/10 hover:border-white/20 transition-all cursor-pointer`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color}`}>
                            <action.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{action.title}</h3>
                            <p className="text-sm text-gray-400">{action.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Recent Bookings</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your latest flight reservations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.recentBookings.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Plane className="h-4 w-4 text-blue-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-white">{booking.flightNumber}</h3>
                                <p className="text-sm text-gray-400">
                                  {booking.from} → {booking.to}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-4 text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(booking.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <span className="font-semibold text-white">₹{booking.amount?.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      <Link to="/bookings">
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          View All Bookings
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 mb-4">No bookings yet</p>
                      <Link to="/flights">
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                          Book Your First Flight
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
