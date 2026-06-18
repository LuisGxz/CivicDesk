using CivicDesk.Application.Common.Exceptions;
using CivicDesk.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CivicDesk.Application.Features.Auth;

public record GetMeQuery(Guid UserId) : IRequest<UserDto>;

public class GetMeHandler(IAppDbContext db) : IRequestHandler<GetMeQuery, UserDto>
{
    public async Task<UserDto> Handle(GetMeQuery request, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new NotFoundException("User", request.UserId);
        return UserDto.From(user);
    }
}
