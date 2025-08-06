import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, RefreshCw, Calendar, MapPin, Users, CreditCard,
  CheckCircle, XCircle, Clock, AlertTriangle, Eye, Plane
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { bookingAPI } from '@/services/api';

const Bookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  // Show notification about automatic status checking on first load
  useEffect(() => {
    const hasShownNotification = localStorage.getItem('booking_status_notification_shown');
    if (!hasShownNotification) {
      toast({
        title: "Automatic Status Updates",
        description: "Your booking statuses are automatically checked and updated based on payment status. Use the Refresh button to manually update.",
      });
      localStorage.setItem('booking_status_notification_shown', 'true');
    }
  }, []);

  // Function to manually update booking status
  const handleManualStatusUpdate = async (booking, newStatus) => {
    try {
      setUpdatingStatus(true);
      console.log(`Manually updating booking ${booking.bookingId} status to ${newStatus}`);
      
      // Test API endpoints first
      console.log('Testing API endpoints...');
      await bookingAPI.testEndpoints(booking.bookingId);
      
      // Try multiple methods to update status
      let updateSuccess = false;
      
      try {
        // First attempt with regular updateStatus
        await bookingAPI.updateStatus(booking.bookingId, newStatus);
        updateSuccess = true;
        console.log('Status update successful with regular method');
      } catch (error) {
        console.log('Regular status update failed, trying alternative...', error);
        
        try {
          // Second attempt with alternative method
          await bookingAPI.updateStatusAlternative(booking.bookingId, newStatus);
          updateSuccess = true;
          console.log('Status update successful with alternative method');
        } catch (altError) {
          console.log('Alternative status update failed, trying admin API...', altError);
          
          try {
            // Third attempt using admin API
            const { adminAPI } = await import('@/services/api');
            await adminAPI.updateBooking(booking.bookingId, { status: newStatus });
            updateSuccess = true;
            console.log('Status update successful with admin API');
          } catch (adminError) {
            console.error('All status update attempts failed:', adminError);
            throw adminError;
          }
        }
      }
      
      if (updateSuccess) {
        toast({
          title: "Status Updated",
          description: `Booking status updated to ${newStatus}`,
        });
        
        // Refresh bookings
        fetchBookings();
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getByUser(user?.userId || user?.id);
      const bookingsData = response.data;

      // Check and update status for pending bookings that have successful payments
      const updatedBookings = await Promise.all(
        bookingsData.map(async (booking) => {
          if (booking.status?.toLowerCase() === 'pending') {
            try {
              const wasUpdated = await bookingAPI.checkAndUpdateStatus(booking.bookingId || booking.id);
              if (wasUpdated) {
                return { ...booking, status: 'Confirmed' };
              }
            } catch (error) {
              console.error(`Error checking status for booking ${booking.bookingId}:`, error);
            }
          }
          return booking;
        })
      );

      setBookings(updatedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.flightNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.departureCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.arrivalCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.bookingId?.toString().includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking =>
        booking.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredBookings(filtered);
  };

  const canCancelBooking = (booking) => {
    if (booking.status?.toLowerCase() === 'cancelled') return false;

    const flightDate = new Date(booking.flightDate);
    const currentDate = new Date();
    const daysDifference = Math.ceil((flightDate - currentDate) / (1000 * 60 * 60 * 24));

    return daysDifference > 2; // Can cancel only if more than 2 days before flight
  };

  const getDaysUntilFlight = (flightDate) => {
    const flight = new Date(flightDate);
    const current = new Date();
    const diffTime = flight - current;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleCancelBooking = async (booking) => {
    if (!canCancelBooking(booking)) {
      const daysUntilFlight = getDaysUntilFlight(booking.flightDate);
      toast({
        title: "Cannot Cancel",
        description: `Bookings can only be cancelled at least 2 days before the flight. Your flight is in ${daysUntilFlight} days.`,
        variant: "destructive"
      });
      return;
    }

    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    try {
      setCancellingBooking(true);
      console.log('Deleting booking:', selectedBooking.bookingId);
      
      // Delete the booking from database
      await bookingAPI.delete(selectedBooking.bookingId);
      
      toast({
        title: "Booking Deleted",
        description: "Your booking has been deleted successfully. Refund will be processed within 5-6 business days.",
      });

      // Refresh bookings
      fetchBookings();
      setShowCancelModal(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error deleting booking:', error);
      
      // Fallback: try to cancel instead of delete
      try {
        console.log('Delete failed, trying to cancel booking...');
        await bookingAPI.cancel(selectedBooking.bookingId);
        
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been cancelled successfully. Refund will be processed within 5-6 business days.",
        });

        // Refresh bookings
        fetchBookings();
        setShowCancelModal(false);
        setSelectedBooking(null);
      } catch (cancelError) {
        console.error('Both delete and cancel failed:', cancelError);
        toast({
          title: "Error",
          description: "Failed to delete/cancel booking. Please try again or contact support.",
          variant: "destructive"
        });
      }
    } finally {
      setCancellingBooking(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-gray-300">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Bookings - Flynest</title>
        <meta name="description" content="Manage your flight bookings and cancellations." />
      </Helmet>

      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              My Bookings
            </h1>
            <p className="text-gray-300">
              Manage your flight bookings and view booking details
            </p>
          </motion.div>

          {/* Filters */}
          <Card className="glass-effect border-white/10 mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bookings</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={fetchBookings}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                {/* Debug button for testing API */}
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    onClick={async () => {
                      if (bookings.length > 0) {
                        const firstBooking = bookings[0];
                        console.log('Testing API for booking:', firstBooking.bookingId);
                        await bookingAPI.testEndpoints(firstBooking.bookingId);
                        toast({
                          title: "API Test",
                          description: "Check console for API test results",
                        });
                      }
                    }}
                    variant="outline"
                    className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                  >
                    Test API
                  </Button>
                )}
              </div>
              
              {/* Status Information */}
              <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white mb-1">Booking Status Information</h4>
                    <p className="text-sm text-gray-300">
                      • <strong>Pending:</strong> Payment is being processed or booking is awaiting confirmation<br/>
                      • <strong>Confirmed:</strong> Payment successful and booking is confirmed<br/>
                      • <strong>Cancelled:</strong> Booking has been cancelled and refund is being processed<br/>
                      <span className="text-blue-400">💡 Tip: Click "Refresh" to automatically update booking statuses based on payment status</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <Card className="glass-effect border-white/10">
              <CardContent className="p-12 text-center">
                <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Bookings Found</h3>
                <p className="text-gray-300 mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? "No bookings match your current filters."
                    : "You haven't made any bookings yet."}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={() => navigate('/flights')}>
                    Search Flights
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBookings.map((booking, index) => (
                <motion.div
                  key={booking.bookingId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="glass-effect border-white/10 hover:border-white/20 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(booking.status)}
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Booking ID</p>
                          <p className="font-mono text-white">{booking.bookingId}</p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Flight Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Plane className="h-4 w-4 text-blue-400" />
                            <div>
                              <p className="text-sm text-gray-400">Flight</p>
                              <p className="font-medium text-white">{booking.flightNumber}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-400" />
                            <div>
                              <p className="text-sm text-gray-400">Route</p>
                              <p className="font-medium text-white">
                                {booking.departureCity} → {booking.arrivalCity}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Date and Passengers */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-purple-400" />
                            <div>
                              <p className="text-sm text-gray-400">Flight Date</p>
                              <p className="font-medium text-white">
                                {new Intl.DateTimeFormat('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }).format(new Date(booking.flightDate))}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-yellow-400" />
                            <div>
                              <p className="text-sm text-gray-400">Passengers</p>
                              <p className="font-medium text-white">{booking.passengerCount || 1}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-green-400" />
                        <div>
                          <p className="text-sm text-gray-400">Total Amount</p>
                          <p className="font-bold text-white text-lg">₹{booking.amount}</p>
                        </div>
                      </div>

                      {/* Days until flight */}
                      {booking.status?.toLowerCase() !== 'cancelled' && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-orange-400" />
                          <div>
                            <p className="text-sm text-gray-400">Days until flight</p>
                            <p className="font-medium text-white">
                              {getDaysUntilFlight(booking.flightDate)} days
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4">
                        {booking.status?.toLowerCase() !== 'cancelled' && canCancelBooking(booking) && (
                          <Button
                            onClick={() => handleCancelBooking(booking)}
                            variant="outline"
                            className="flex-1 border-red-400/30 text-red-400 hover:bg-red-400/10"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Booking
                          </Button>
                        )}

                        {booking.status?.toLowerCase() !== 'cancelled' && !canCancelBooking(booking) && (
                          <div className="flex items-center space-x-2 text-sm text-orange-400 bg-orange-500/10 p-3 rounded-lg">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Cannot delete within 2 days of flight</span>
                          </div>
                        )}

                        {/* Manual Status Update for Pending Bookings */}
                        {booking.status?.toLowerCase() === 'pending' && (
                          <Button
                            onClick={() => handleManualStatusUpdate(booking, 'Confirmed')}
                            disabled={updatingStatus}
                            variant="outline"
                            className="flex-1 border-green-400/30 text-green-400 hover:bg-green-400/10"
                          >
                            {updatingStatus ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Confirmed
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && selectedBooking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card className="glass-effect border-red-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span>Delete Booking</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">
                  Are you sure you want to delete your booking for flight {selectedBooking.flightNumber}?
                </p>
                
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">⚠️ This action cannot be undone</h4>
                      <p className="text-sm text-gray-300">
                        This will permanently delete your booking from the database. Your refund will be processed within 5-6 business days.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 border-gray-400/30 text-gray-300 hover:bg-gray-400/10"
                  >
                    Keep Booking
                  </Button>
                  <Button
                    onClick={confirmCancellation}
                    disabled={cancellingBooking}
                    className="flex-1 bg-red-500 hover:bg-red-600"
                  >
                    {cancellingBooking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Delete Booking
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default Bookings; 