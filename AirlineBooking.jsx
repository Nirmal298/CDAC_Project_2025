import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Plane, Calendar, MapPin, Users, CreditCard,
  CheckCircle, ExternalLink, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { bookingAPI } from '@/services/api';
import PaymentGateway from '@/components/PaymentGateway';

const AirlineBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Get data from navigation state
  const { bookingId, flightData, passengerCount } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('pending');
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);

  // If no booking data, redirect back
  useEffect(() => {
    if (!bookingId || !flightData) {
      navigate('/flights');
    }
  }, [bookingId, flightData, navigate]);

  // Function to refresh booking status
  const refreshBookingStatus = async () => {
    try {
      const response = await bookingAPI.getById(bookingId);
      const currentStatus = response.data?.status;
      console.log('Current booking status:', currentStatus);
      setBookingStatus(currentStatus?.toLowerCase() || 'pending');
    } catch (error) {
      console.error('Error refreshing booking status:', error);
    }
  };

  const totalAmount = flightData.price * passengerCount;

  const handleCompleteBooking = () => {
    setShowPaymentGateway(true);
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    try {
      console.log('Payment successful, updating booking status for booking ID:', bookingId);
      
      // Try multiple methods to update booking status to confirmed
      let updateSuccess = false;
      
      try {
        // First attempt with regular updateStatus
        const updateResponse = await bookingAPI.updateStatus(bookingId, 'Confirmed');
        console.log('Booking status update response:', updateResponse);
        updateSuccess = true;
      } catch (error) {
        console.error('Regular status update failed:', error);
        
        try {
          // Second attempt with alternative method
          await bookingAPI.updateStatusAlternative(bookingId, 'Confirmed');
          updateSuccess = true;
          console.log('Alternative status update successful');
        } catch (altError) {
          console.error('Alternative status update failed:', altError);
          
          try {
            // Third attempt using admin API
            const { adminAPI } = await import('@/services/api');
            await adminAPI.updateBooking(bookingId, { status: 'Confirmed' });
            updateSuccess = true;
            console.log('Admin API status update successful');
          } catch (adminError) {
            console.error('All status update attempts failed:', adminError);
          }
        }
      }
      
      if (updateSuccess) {
        setBookingStatus('confirmed');
        setShowPaymentGateway(false);
        
        // Refresh booking status to ensure it's updated
        await refreshBookingStatus();
        
        toast({
          title: "Booking Complete!",
          description: "Your flight booking has been confirmed and payment processed successfully! Redirecting to payment history..."
        });
        
        // Add a small delay to ensure the status is updated before redirecting
        setTimeout(() => navigate('/payments'), 2000);
      } else {
        // Even if status update fails, payment was successful
        toast({
          title: "Payment Successful",
          description: "Payment processed successfully! Your booking may show as pending - please contact support if needed.",
        });
        setTimeout(() => navigate('/payments'), 2000);
      }
    } catch (error) {
      console.error('Error in payment success handler:', error);
      
      // Even if everything fails, payment was successful
      toast({
        title: "Payment Successful",
        description: "Payment processed successfully! Your booking may show as pending - please contact support if needed.",
      });
      setTimeout(() => navigate('/payments'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFailure = () => {
    setShowPaymentGateway(false);
    toast({
      title: "Payment Failed",
      description: "Payment was not completed. Please try again.",
      variant: "destructive"
    });
  };

  const handleExternalBooking = () => {
    toast({
      title: "External Booking",
      description: "Redirecting to airline's booking system...",
    });
  };

  if (!bookingId || !flightData) return null;

  return (
    <>
      <Helmet>
        <title>Complete Booking - Flynest</title>
        <meta name="description" content="Complete your flight booking with the airline." />
      </Helmet>

      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => navigate('/flights')}
              className="mb-4 text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Flights
            </Button>

            <h1 className="text-4xl font-bold text-white mb-2">
              Complete Your Booking
            </h1>
            <p className="text-gray-300">Your passenger information has been saved. Complete your booking below.</p>
          </motion.div>

          {/* Booking Summary */}
          <Card className="glass-effect border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Booking Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Plane className="h-4 w-4 text-blue-400" />
                    <div>
                      <p className="text-sm text-gray-400">Flight Number</p>
                      <p className="font-medium text-white">{flightData.flightNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-400">Route</p>
                      <p className="font-medium text-white">
                        {flightData.departureAirport} → {flightData.arrivalAirport}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Date</p>
                      <p className="font-medium text-white">
                        {new Intl.DateTimeFormat('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }).format(new Date(flightData.flightDate))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-yellow-400" />
                    <div>
                      <p className="text-sm text-gray-400">Passengers</p>
                      <p className="font-medium text-white">{passengerCount} passenger(s)</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-400">Total Amount</p>
                      <p className="font-bold text-white text-xl">₹{totalAmount}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Booking ID: {bookingId}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Complete with Flynest */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Complete with Flynest</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Complete your booking through our secure payment system. Your booking will be confirmed immediately.
                </p>
                <div className="space-y-2">
                  {["Instant confirmation", "Secure payment processing", "24/7 customer support"].map((text) => (
                    <div key={text} className="flex items-center space-x-2 text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleCompleteBooking}
                  disabled={loading || bookingStatus === 'confirmed'}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : bookingStatus === 'confirmed' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Booking Confirmed
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Pay & Complete Booking
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Book with Airline */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <ExternalLink className="h-5 w-5 text-blue-400" />
                  <span>Book with {flightData.airlineName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Book directly with {flightData.airlineName} using your saved passenger information.
                  You’ll be redirected to their official website.
                </p>
                {["Direct airline booking", "Airline's terms apply", "Passenger info pre-filled"].map((text) => (
                  <div key={text} className="flex items-center space-x-2 text-sm text-gray-300">
                    <ExternalLink className="h-4 w-4 text-blue-400" />
                    <span>{text}</span>
                  </div>
                ))}
                <Button
                  onClick={handleExternalBooking}
                  variant="outline"
                  className="w-full border-blue-400/30 text-blue-400 hover:bg-blue-400/10"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Book with Airline
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Notice */}
          <Card className="glass-effect border-yellow-500/30 mt-8">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Important Notice</h3>
                  <p className="text-gray-300 text-sm">
                    Your passenger information has been saved. You may book via Flynest or directly with the airline. Your details are securely stored.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

             {/* Payment Gateway */}
       {showPaymentGateway && (
         <PaymentGateway
           amount={totalAmount}
           bookingId={bookingId}
           onPaymentSuccess={handlePaymentSuccess}
           onPaymentFailure={handlePaymentFailure}
           onClose={() => setShowPaymentGateway(false)}
         />
       )}
    </>
  );
};

export default AirlineBooking;
