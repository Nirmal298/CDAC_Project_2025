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
    public class AirplanesController : ControllerBase
    {
        private readonly FlynestDbContext _context;

        public AirplanesController(FlynestDbContext context)
        {
            _context = context;
        }

        // GET: api/Airplanes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Airplane>>> GetAirplanes()
        {
            return await _context.Airplanes.ToListAsync();
        }

        // GET: api/Airplanes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Airplane>> GetAirplane(int id)
        {
            var airplane = await _context.Airplanes.FindAsync(id);

            if (airplane == null)
            {
                return NotFound();
            }

            return airplane;
        }

        // PUT: api/Airplanes/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutAirplane(int id, Airplane airplane)
        {
            if (id != airplane.Id)
            {
                return BadRequest();
            }

            _context.Entry(airplane).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AirplaneExists(id))
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

        // POST: api/Airplanes
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Airplane>> PostAirplane(Airplane airplane)
        {
            _context.Airplanes.Add(airplane);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetAirplane", new { id = airplane.Id }, airplane);
        }

        // DELETE: api/Airplanes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAirplane(int id)
        {
            var airplane = await _context.Airplanes.FindAsync(id);
            if (airplane == null)
            {
                return NotFound();
            }

            _context.Airplanes.Remove(airplane);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool AirplaneExists(int id)
        {
            return _context.Airplanes.Any(e => e.Id == id);
        }
    }
}
