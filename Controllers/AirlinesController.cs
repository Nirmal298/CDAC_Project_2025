using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using flynest.Models;

namespace flynest.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AirlinesController : ControllerBase
    {
        private readonly FlynestDbContext _context;

        public AirlinesController(FlynestDbContext context)
        {
            _context = context;
        }

        // GET: api/airlines
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Airline>>> GetAirlines()
        {
            return await _context.Airlines.Include(a => a.CountryIso2Navigation).ToListAsync();
        }

        // GET: api/airlines/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Airline>> GetAirline(int id)
        {
            var airline = await _context.Airlines
                .Include(a => a.CountryIso2Navigation)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (airline == null)
                return NotFound();

            return airline;
        }

        // POST: api/airlines
        [HttpPost]
        public async Task<ActionResult<Airline>> CreateAirline([FromBody] Airline airline)
        {
            _context.Airlines.Add(airline);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAirline), new { id = airline.Id }, airline);
        }

        // PUT: api/airlines/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAirline(int id, [FromBody] Airline airline)
        {
            if (id != airline.Id)
                return BadRequest();

            _context.Entry(airline).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Airlines.Any(a => a.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // DELETE: api/airlines/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAirline(int id)
        {
            var airline = await _context.Airlines.FindAsync(id);
            if (airline == null)
                return NotFound();

            _context.Airlines.Remove(airline);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
