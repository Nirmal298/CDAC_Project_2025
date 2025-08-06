import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Plane, Calendar, MapPin, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { bookingAPI, passengerAPI } from '@/services/api';

const PassengerInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get flight data from navigation state
  const flightData = location.state?.flightData;
  
  const [passengers, setPassengers] = useState([{
    full_name: '',
    gender: '',
    age: '',
    passport_number: ''
  }]);
  
  const [loading, setLoading] = useState(false);

  // If no flight data, redirect back to flights page
  if (!flightData) {
    navigate('/flights');
    return null;
  }

  const addPassenger = () => {
    setPassengers([...passengers, {
      full_name: '',
      gender: '',
      age: '',
      passport_number: ''
    }]);
  };

  const removePassenger = (index) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index));
    }
  };

  const updatePassenger = (index, field, value) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index][field] = value;
    setPassengers(updatedPassengers);
  };

  const validateForm = () => {
    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      console.log(`Validating passenger ${i + 1}:`, passenger);
      
      if (!passenger.full_name || !passenger.full_name.trim()) {
        console.log(`Passenger ${i + 1} missing full_name`);
        return false;
      }
      if (!passenger.gender) {
        console.log(`Passenger ${i + 1} missing gender`);
        return false;
      }
      if (!passenger.age || passenger.age <= 0) {
        console.log(`Passenger ${i + 1} missing or invalid age`);
        return false;
      }
      if (!passenger.passport_number || !passenger.passport_number.trim()) {
        console.log(`Passenger ${i + 1} missing passport_number`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all passenger information fields.",
        variant: "destructive"
      });
      return;
    }

    // Debug: Log the passenger data being submitted
    console.log('Passengers data to submit:', passengers);

    setLoading(true);
    
    try {
      // First, create the booking
      const bookingData = {
        userId: user.userId || user.id,
        flightId: flightData.id,
        flightNumber: flightData.flightNumber,
        departureCity: flightData.departureAirport,
        arrivalCity: flightData.arrivalAirport,
        flightDate: flightData.flightDate,
        amount: flightData.price ?? 0,
        status: 'Pending'
      };

      console.log('Creating booking with data:', bookingData);
      console.log('API Base URL:', import.meta.env.VITE_API_URL || 'https://localhost:44327/api');
      console.log('User token:', localStorage.getItem('flynest_token'));
      
      const bookingResponse = await bookingAPI.create(bookingData);
      console.log('Booking response:', bookingResponse);
      
      // Extract booking ID - try different possible field names
      const bookingId = bookingResponse.data?.bookingId || 
                       bookingResponse.data?.id || 
                       bookingResponse.data?.booking_id ||
                       bookingResponse.data?.bookingId;
      
      console.log('Extracted booking ID:', bookingId);

      if (!bookingId) {
        throw new Error('Failed to get booking ID from response');
      }

      // Now create passengers using the PassengersController
      console.log('Creating passengers for booking ID:', bookingId);
      
      // Try creating passengers one by one to identify which one fails
      for (let i = 0; i < passengers.length; i++) {
        const passenger = passengers[i];
        console.log(`Creating passenger ${i + 1}:`, passenger);
        
        // Use exact C# model field names (PascalCase) from PassengersController
        const passengerData = {
          BookingId: bookingId,
          FullName: passenger.full_name,
          Gender: passenger.gender,
          Age: parseInt(passenger.age),
          PassportNumber: passenger.passport_number
        };
        console.log(`Sending passenger ${i + 1} data:`, passengerData);
        console.log('Passenger API URL:', `${import.meta.env.VITE_API_URL || 'https://localhost:44327/api'}/Passengers`);
        
        try {
          const passengerResponse = await passengerAPI.create(passengerData);
          console.log(`Passenger ${i + 1} created successfully:`, passengerResponse);
        } catch (passengerError) {
          console.error(`Failed to create passenger ${i + 1}:`, passengerError);
          console.error('Passenger error details:', {
            message: passengerError.message,
            response: passengerError.response?.data,
            status: passengerError.response?.status
          });
          throw passengerError;
        }
      }

      toast({
        title: "Booking Created Successfully",
        description: "Your booking and passenger information have been saved."
      });

      // Redirect to airline booking page with booking ID
      navigate('/airline-booking', { 
        state: { 
          bookingId: bookingId,
          flightData: flightData,
          passengerCount: passengers.length
        } 
      });

    } catch (error) {
      console.error('Error creating booking:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      
      let errorMessage = "Failed to save passenger information. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.title) {
        errorMessage = error.response.data.title;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Passenger Information - Flynest</title>
        <meta name="description" content="Enter passenger details for your flight booking." />
      </Helmet>

      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
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
              Passenger Information
            </h1>
            <p className="text-gray-300">Please provide details for all passengers</p>
          </motion.div>

          {/* Flight Summary */}
          <Card className="glass-effect border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Plane className="h-5 w-5" />
                <span>Flight Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">From</p>
                    <p className="font-medium">{flightData.departureAirport}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">To</p>
                    <p className="font-medium">{flightData.arrivalAirport}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Date</p>
                    <p className="font-medium">
                      {new Intl.DateTimeFormat('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }).format(new Date(flightData.flightDate))}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400">Flight</p>
                    <p className="font-medium text-white">{flightData.flightNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Price</p>
                    <p className="font-bold text-white text-xl">₹{flightData.price}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passenger Information Form */}
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Passenger Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {passengers.map((passenger, index) => (
                  <div key={index} className="border border-white/10 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        Passenger {index + 1}
                      </h3>
                      {passengers.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removePassenger(index)}
                          className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`full_name_${index}`} className="text-white">
                          Full Name
                        </Label>
                        <Input
                          id={`full_name_${index}`}
                          value={passenger.full_name}
                          onChange={(e) => updatePassenger(index, 'full_name', e.target.value)}
                          placeholder="Enter full name"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`gender_${index}`} className="text-white">
                          Gender
                        </Label>
                        <Select 
                          value={passenger.gender} 
                          onValueChange={(value) => updatePassenger(index, 'gender', value)}
                          required
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor={`age_${index}`} className="text-white">
                          Age
                        </Label>
                        <Input
                          id={`age_${index}`}
                          type="number"
                          min="0"
                          max="120"
                          value={passenger.age}
                          onChange={(e) => updatePassenger(index, 'age', e.target.value)}
                          placeholder="Enter age"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`passport_${index}`} className="text-white">
                          Passport Number
                        </Label>
                        <Input
                          id={`passport_${index}`}
                          value={passenger.passport_number}
                          onChange={(e) => updatePassenger(index, 'passport_number', e.target.value)}
                          placeholder="Enter passport number"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPassenger}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    + Add Another Passenger
                  </Button>
                </div>
                
                <div className="pt-6 border-t border-white/10">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Continue to Payment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PassengerInfo; 