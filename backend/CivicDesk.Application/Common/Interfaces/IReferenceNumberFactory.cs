namespace CivicDesk.Application.Common.Interfaces;

/// <summary>Produces public application reference numbers, e.g. "RB-2026-0418".</summary>
public interface IReferenceNumberFactory
{
    string Next();
}
