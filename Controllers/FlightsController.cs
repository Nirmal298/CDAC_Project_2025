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
    public class FlightsController : ControllerBase
    {
        private readonly FlynestDbContext _context;

        public FlightsController(FlynestDbContext context)
        {
            _context = context;
        }

        // GET: api/Flights
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Flight>>> GetFlights()
        {
            return await _context.Flights.ToListAsync();
        }

        // GET: api/Flights/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Flight>> GetFlight(long id)
        {
            var flight = await _context.Flights.FindAsync(id);

            if (flight == null)
            {
                return NotFound();
            }

            return flight;
        }

        // ✅ NEW: Search by departureAirport, arrivalAirport, and flightDate
        // GET: api/Flights/search
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Flight>>> SearchFlights(
     [FromQuery] string departureAirport,
     [FromQuery] string arrivalAirport,
     [FromQuery] string flightDate)
        {
            Console.WriteLine($"Searching: from={departureAirport}, to={arrivalAirport}, date={flightDate}");

            if (!DateOnly.TryParse(flightDate, out var parsedDate))
            {
                Console.WriteLine("❌ Date parse failed");
                return BadRequest("Invalid date format. Use YYYY-MM-DD.");
            }

            var flights = await _context.Flights
                .Where(f =>
                    f.DepartureAirport == departureAirport &&
                    f.ArrivalAirport == arrivalAirport &&
                    f.FlightDate == parsedDate)
                .ToListAsync();

            if (!flights.Any())
            {
                Console.WriteLine("⚠️ No matching flights");
                return NotFound("No matching flights found.");
            }

            return Ok(flights);
        }



        // GET: api/Flights/by-date
        [HttpGet("by-date")]
        public async Task<ActionResult<IEnumerable<Flight>>> GetFlightsByDate([FromQuery] DateOnly date)
        {
            var flights = await _context.Flights
                .Where(f => f.FlightDate == date)
                .OrderBy(f => f.FlightDate)
                .ToListAsync();

            return flights.Any() ? Ok(flights) : NotFound("No flights found on this date.");
        }

        // PUT: api/Flights/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFlight(long id, Flight flight)
        {
            if (id != flight.Id)
            {
                return BadRequest();
            }

            _context.Entry(flight).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!FlightExists(id))
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

        // POST: api/Flights
        [HttpPost]
        public async Task<ActionResult<Flight>> PostFlight(Flight flight)
        {
            _context.Flights.Add(flight);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetFlight", new { id = flight.Id }, flight);
        }

        // DELETE: api/Flights/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFlight(long id)
        {
            var flight = await _context.Flights.FindAsync(id);
            if (flight == null)
            {
                return NotFound();
            }

            _context.Flights.Remove(flight);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool FlightExists(long id)
        {
            return _context.Flights.Any(e => e.Id == id);
        }
    }
}
