using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using flynest.Models;

namespace flynest.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookingsController : ControllerBase
    {
        private readonly FlynestDbContext _context;

        public BookingsController(FlynestDbContext context)
        {
            _context = context;
        }

        // ✅ GET: api/Bookings
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Booking>>> GetBookings()
        {
            return await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Flight)
                .ToListAsync();
        }

        // ✅ GET: api/Bookings/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Booking>> GetBooking(int id)
        {
            var booking = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Flight)
                .FirstOrDefaultAsync(b => b.BookingId == id);

            if (booking == null)
            {
                return NotFound();
            }

            return booking;
        }

        // ✅ PUT: api/Bookings/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBooking(int id, Booking booking)
        {
            if (id != booking.BookingId)
            {
                return BadRequest();
            }

            _context.Entry(booking).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BookingExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // GET: api/bookings/user/5
        [HttpGet("user/{id}")]
        public async Task<ActionResult<IEnumerable<Booking>>> GetBookingsByUserId(int id)
        {
            var bookings = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Flight)
                .Where(b => b.UserId == id)
                .ToListAsync();

            if (bookings == null || bookings.Count == 0)
            {
                return NotFound(); // Optional: return empty list instead
            }

            return Ok(bookings);
        }


        // GET: api/bookings/ids/user/5
        [HttpGet("ids/user/{userId}")]
        public async Task<ActionResult<IEnumerable<int>>> GetBookingIdsByUserId(int userId)
        {
            var bookingIds = await _context.Bookings
                .Where(b => b.UserId == userId)
                .Select(b => b.BookingId)
                .ToListAsync();

            if (bookingIds == null || bookingIds.Count == 0)
            {
                return NotFound(); // or return Ok(new List<int>());
            }

            return Ok(bookingIds);
        }




        // ✅ POST: api/Bookings
        [HttpPost]
        public async Task<ActionResult<Booking>> PostBooking(Booking booking)
        {
            booking.BookingDate = DateTime.Now; // Ensure date is set on API side if not passed
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBooking), new { id = booking.BookingId }, booking);
        }

        // ✅ DELETE: api/Bookings/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBooking(int id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null)
            {
                return NotFound();
            }

            _context.Bookings.Remove(booking);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BookingExists(int id)
        {
            return _context.Bookings.Any(e => e.BookingId == id);
        }
    }
}
