using System.Text;
using CivicDesk.Application.Common.Interfaces;
using CivicDesk.Domain.Entities;
using CivicDesk.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CivicDesk.Infrastructure.Persistence;

/// <summary>
/// Seeds a realistic demo dataset: the service catalog with config-driven forms, demo accounts for
/// each role, and a spread of applications across every workflow state so the officer inbox and the
/// citizen tracker both look alive on first load. Idempotent — runs only when the catalog is empty.
/// </summary>
public class DevDataSeeder(CivicDeskDbContext db, IPasswordHasherService hasher)
{
    // A minimal valid PDF so demo document downloads open in a viewer.
    private static readonly byte[] SamplePdf = Encoding.ASCII.GetBytes(
        "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
        "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");

    public async Task SeedAsync()
    {
        if (await db.ServiceTypes.AnyAsync())
            return;

        var users = SeedUsers();
        var services = SeedCatalog();
        await db.SaveChangesAsync();

        SeedApplications(users, services);
        await db.SaveChangesAsync();
    }

    private DemoUsers SeedUsers()
    {
        User Make(string email, string name, UserRole role, string password, string? dept = null) => new()
        {
            Email = email,
            FullName = name,
            Role = role,
            Department = dept,
            PasswordHash = hasher.Hash(password)
        };

        var citizen = Make("citizen@civicdesk.gov", "María González", UserRole.Citizen, "Citizen123!");
        var citizen2 = Make("john@civicdesk.gov", "John Carter", UserRole.Citizen, "Citizen123!");
        var officer = Make("officer@civicdesk.gov", "James Okoro", UserRole.Officer, "Officer123!", "Zoning");
        var officer2 = Make("clerk@civicdesk.gov", "Wei Chen", UserRole.Officer, "Officer123!", "Records");
        var supervisor = Make("supervisor@civicdesk.gov", "Sarah Bennett", UserRole.Supervisor, "Supervisor123!", "Permits");

        db.Users.AddRange(citizen, citizen2, officer, officer2, supervisor);
        return new DemoUsers(citizen, citizen2, officer, officer2, supervisor);
    }

    private Dictionary<string, ServiceType> SeedCatalog()
    {
        var services = new List<ServiceType>
        {
            BuildService("business-license", "Business operating license", "Licencia de funcionamiento comercial",
                "Apply for or renew a license to operate a commercial business in the city.",
                "Solicita o renueva la licencia para operar un negocio comercial en la ciudad.",
                "store", ServiceCategory.Business, 120m, "5–7 days", "5–7 días", 0,
                fields:
                [
                    F("business_name", "Business name", "Nombre del negocio", FormFieldType.Text, true, 0, maxLength: 120),
                    Sel("business_type", "Business type", "Tipo de negocio", true, 1,
                        "retail:Retail:Comercio minorista|food:Food service:Servicio de comida|services:Professional services:Servicios profesionales"),
                    F("tax_id", "Tax ID", "RUC / ID fiscal", FormFieldType.Text, true, 2, maxLength: 20),
                    F("address", "Business address", "Dirección del negocio", FormFieldType.Text, true, 3, maxLength: 200),
                    Num("employees", "Number of employees", "Número de empleados", false, 4, 0, 9999),
                    F("start_date", "Intended start date", "Fecha de inicio prevista", FormFieldType.Date, true, 5)
                ],
                docs:
                [
                    D("government_id", "Government-issued ID", "Identificación oficial", true, 0),
                    D("lease_agreement", "Lease agreement", "Contrato de arrendamiento", true, 1),
                    D("zoning_certificate", "Zoning certificate (issued within 90 days)", "Certificado de zonificación (emitido en los últimos 90 días)", true, 2)
                ]),

            BuildService("parking-permit", "Parking permit", "Permiso de estacionamiento",
                "Residential and commercial zone parking permits for your vehicle.",
                "Permisos de estacionamiento en zonas residenciales y comerciales para tu vehículo.",
                "car-front", ServiceCategory.Permits, 35m, "48 hours", "48 horas", 1,
                fields:
                [
                    Sel("zone", "Permit zone", "Zona del permiso", true, 0,
                        "residential:Residential:Residencial|commercial:Commercial:Comercial"),
                    F("plate", "License plate", "Placa del vehículo", FormFieldType.Text, true, 1, maxLength: 12),
                    F("vehicle_make", "Vehicle make", "Marca del vehículo", FormFieldType.Text, false, 2, maxLength: 40),
                    F("vehicle_model", "Vehicle model", "Modelo del vehículo", FormFieldType.Text, false, 3, maxLength: 40)
                ],
                docs:
                [
                    D("government_id", "Government-issued ID", "Identificación oficial", true, 0),
                    D("proof_of_residency", "Proof of residency", "Comprobante de domicilio", true, 1),
                    D("vehicle_registration", "Vehicle registration", "Matrícula del vehículo", true, 2)
                ]),

            BuildService("birth-certificate", "Birth certificate", "Acta de nacimiento",
                "Request certified digital or paper copies of a birth certificate.",
                "Solicita copias certificadas digitales o en papel de un acta de nacimiento.",
                "file-badge", ServiceCategory.Records, 15m, "24 hours", "24 horas", 2,
                fields:
                [
                    F("full_name", "Full name on certificate", "Nombre completo en el acta", FormFieldType.Text, true, 0, maxLength: 120),
                    F("date_of_birth", "Date of birth", "Fecha de nacimiento", FormFieldType.Date, true, 1),
                    Num("copies", "Number of copies", "Número de copias", true, 2, 1, 10),
                    Sel("purpose", "Purpose", "Propósito", true, 3,
                        "legal:Legal:Legal|travel:Travel:Viaje|personal:Personal:Personal")
                ],
                docs:
                [
                    D("government_id", "Government-issued ID", "Identificación oficial", true, 0),
                    D("supporting_document", "Supporting document (optional)", "Documento de apoyo (opcional)", false, 1)
                ]),

            BuildService("building-permit", "Building permit", "Permiso de construcción",
                "Permits for renovations, additions and new construction.",
                "Permisos para remodelaciones, ampliaciones y obra nueva.",
                "hammer", ServiceCategory.Permits, 240m, "10–15 days", "10–15 días", 3,
                fields:
                [
                    Sel("project_type", "Project type", "Tipo de proyecto", true, 0,
                        "renovation:Renovation:Remodelación|addition:Addition:Ampliación|new:New construction:Obra nueva"),
                    F("property_address", "Property address", "Dirección del predio", FormFieldType.Text, true, 1, maxLength: 200),
                    Num("estimated_value", "Estimated project value (USD)", "Valor estimado del proyecto (USD)", true, 2, 0, 100000000),
                    F("contractor", "Contractor name", "Nombre del contratista", FormFieldType.Text, false, 3, maxLength: 120),
                    Area("description", "Project description", "Descripción del proyecto", true, 4)
                ],
                docs:
                [
                    D("government_id", "Government-issued ID", "Identificación oficial", true, 0),
                    D("site_plan", "Site plan", "Plano del sitio", true, 1),
                    D("property_deed", "Property deed", "Escritura de propiedad", true, 2)
                ]),

            BuildService("bulk-waste", "Bulk waste pickup", "Recolección de residuos voluminosos",
                "Schedule large-item collection at your address.",
                "Agenda la recolección de objetos voluminosos en tu domicilio.",
                "trash-2", ServiceCategory.Community, 0m, "Next pickup", "Próxima ruta", 4,
                fields:
                [
                    F("address", "Pickup address", "Dirección de recolección", FormFieldType.Text, true, 0, maxLength: 200),
                    Area("item_description", "What needs to be collected?", "¿Qué se debe recolectar?", true, 1),
                    F("preferred_date", "Preferred date", "Fecha preferida", FormFieldType.Date, false, 2)
                ],
                docs:
                [
                    D("government_id", "Government-issued ID", "Identificación oficial", true, 0)
                ]),

            BuildService("pet-registration", "Pet registration", "Registro de mascotas",
                "Register or renew your pet's municipal tag.",
                "Registra o renueva la placa municipal de tu mascota.",
                "dog", ServiceCategory.Community, 10m, "Instant", "Inmediato", 5,
                fields:
                [
                    F("pet_name", "Pet name", "Nombre de la mascota", FormFieldType.Text, true, 0, maxLength: 60),
                    Sel("species", "Species", "Especie", true, 1,
                        "dog:Dog:Perro|cat:Cat:Gato|other:Other:Otro"),
                    F("breed", "Breed", "Raza", FormFieldType.Text, false, 2, maxLength: 60),
                    Check("rabies_vaccinated", "Rabies vaccination up to date", "Vacuna antirrábica al día", true, 3)
                ],
                docs:
                [
                    D("government_id", "Government-issued ID", "Identificación oficial", true, 0),
                    D("vaccination_record", "Vaccination record", "Cartilla de vacunación", true, 1)
                ])
        };

        db.ServiceTypes.AddRange(services);
        return services.ToDictionary(s => s.Slug);
    }

    private void SeedApplications(DemoUsers u, Dictionary<string, ServiceType> svc)
    {
        var now = DateTime.UtcNow;

        // María — one application in (almost) every state, so the citizen tracker tells a full story.
        Build(svc["business-license"], u.Citizen, now.AddDays(-7),
            new() { ["business_name"] = "González Coffee House", ["business_type"] = "food", ["tax_id"] = "099-554-221", ["address"] = "418 Main St, Riverton", ["employees"] = "6", ["start_date"] = "2026-08-01" },
            ["government_id", "lease_agreement", "zoning_certificate"],
            app => { app.Submit(now.AddDays(-7)); app.StartReview(u.Officer.Id, now.AddDays(-6)); });

        Build(svc["building-permit"], u.Citizen, now.AddDays(-10),
            new() { ["project_type"] = "addition", ["property_address"] = "418 Main St, Riverton", ["estimated_value"] = "45000", ["contractor"] = "Bright Build LLC", ["description"] = "Rear kitchen extension, ~30 m²." },
            ["government_id", "site_plan", "property_deed"],
            app =>
            {
                app.Submit(now.AddDays(-10));
                app.StartReview(u.Supervisor.Id, now.AddDays(-9));
                app.RequestInfo(u.Supervisor.Id, "Your site plan is missing the setback dimensions on the north boundary. Please upload an updated plan.", "Tu plano del sitio no incluye las distancias de retiro en el lindero norte. Sube un plano actualizado.", now.AddDays(-8));
            });

        Build(svc["birth-certificate"], u.Citizen, now.AddDays(-4),
            new() { ["full_name"] = "María Fernanda González", ["date_of_birth"] = "1991-03-14", ["copies"] = "2", ["purpose"] = "travel" },
            ["government_id"],
            app =>
            {
                app.Submit(now.AddDays(-4));
                app.StartReview(u.Clerk.Id, now.AddDays(-4).AddHours(2));
                app.Approve(u.Clerk.Id, null, null, now.AddDays(-3));
            });

        Build(svc["pet-registration"], u.Citizen, now.AddDays(-12),
            new() { ["pet_name"] = "Toby", ["species"] = "dog", ["breed"] = "Beagle", ["rabies_vaccinated"] = "true" },
            ["government_id", "vaccination_record"],
            app =>
            {
                app.Submit(now.AddDays(-12));
                app.StartReview(u.Clerk.Id, now.AddDays(-11));
                app.Reject(u.Clerk.Id, "The vaccination record has expired (issued more than 12 months ago). Please vaccinate and reapply.", "La cartilla de vacunación está vencida (emitida hace más de 12 meses). Vacuna a tu mascota y vuelve a solicitar.", now.AddDays(-11));
            });

        Build(svc["bulk-waste"], u.Citizen, now.AddDays(-1),
            new() { ["address"] = "418 Main St, Riverton", ["item_description"] = "Old sofa and a broken refrigerator.", ["preferred_date"] = "2026-06-25" },
            ["government_id"],
            app => app.Submit(now.AddDays(-1)));

        // John — a couple more in the officer queue for inbox variety.
        Build(svc["parking-permit"], u.Citizen2, now.AddDays(-2),
            new() { ["zone"] = "residential", ["plate"] = "RV-8821", ["vehicle_make"] = "Toyota", ["vehicle_model"] = "Corolla" },
            ["government_id", "proof_of_residency", "vehicle_registration"],
            app => app.Submit(now.AddDays(-2)));

        Build(svc["business-license"], u.Citizen2, now.AddDays(-5),
            new() { ["business_name"] = "Carter Hardware", ["business_type"] = "retail", ["tax_id"] = "077-112-908", ["address"] = "12 Elm Ave, Riverton", ["employees"] = "3", ["start_date"] = "2026-07-15" },
            ["government_id", "lease_agreement", "zoning_certificate"],
            app => { app.Submit(now.AddDays(-5)); app.StartReview(u.Officer.Id, now.AddDays(-4)); });

        Build(svc["building-permit"], u.Citizen2, now.AddDays(-3),
            new() { ["project_type"] = "new", ["property_address"] = "12 Elm Ave, Riverton", ["estimated_value"] = "180000", ["contractor"] = "Carter & Sons", ["description"] = "New two-story detached garage." },
            ["government_id", "site_plan", "property_deed"],
            app => app.Submit(now.AddDays(-3)));
    }

    private void Build(ServiceType service, User citizen, DateTime createdAt,
        Dictionary<string, string> fields, string[] docSlots, Action<ServiceApplication> drive)
    {
        var app = new ServiceApplication
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = $"RB-{createdAt.Year}-{Random.Shared.Next(0, 10000):D4}",
            ServiceTypeId = service.Id,
            CitizenId = citizen.Id,
            Fee = service.Fee,
            CreatedAtUtc = createdAt
        };

        foreach (var (key, value) in fields)
            app.FieldValues.Add(new ApplicationFieldValue { ApplicationId = app.Id, FieldKey = key, Value = value });

        foreach (var slot in docSlots)
            app.Documents.Add(new ApplicationDocument
            {
                ApplicationId = app.Id,
                SlotKey = slot,
                FileName = $"{slot}.pdf",
                ContentType = "application/pdf",
                SizeBytes = SamplePdf.Length,
                Content = SamplePdf,
                UploadedAtUtc = createdAt
            });

        drive(app);
        db.Applications.Add(app);
    }

    // ── small builders to keep the catalog declaration readable ──
    private static ServiceType BuildService(string slug, string nameEn, string nameEs, string descEn, string descEs,
        string icon, ServiceCategory category, decimal fee, string timeEn, string timeEs, int sort,
        List<FormField> fields, List<RequiredDocument> docs)
    {
        var service = new ServiceType
        {
            Slug = slug, NameEn = nameEn, NameEs = nameEs, DescriptionEn = descEn, DescriptionEs = descEs,
            Icon = icon, Category = category, Fee = fee, ProcessingTimeEn = timeEn, ProcessingTimeEs = timeEs, SortOrder = sort
        };
        // FK ServiceTypeId is set by EF relationship fixup when the children are added via the
        // navigation collections, so the Guid.Empty placeholders below are overwritten on save.
        foreach (var f in fields) service.FormFields.Add(f);
        foreach (var d in docs) service.RequiredDocuments.Add(d);
        return service;
    }

    private static FormField F(string key, string en, string es, FormFieldType type, bool req, int sort, int? maxLength = null) =>
        new() { ServiceTypeId = Guid.Empty, Key = key, LabelEn = en, LabelEs = es, Type = type, Required = req, SortOrder = sort, MaxLength = maxLength };

    private static FormField Area(string key, string en, string es, bool req, int sort) =>
        new() { ServiceTypeId = Guid.Empty, Key = key, LabelEn = en, LabelEs = es, Type = FormFieldType.Textarea, Required = req, SortOrder = sort, MaxLength = 2000 };

    private static FormField Num(string key, string en, string es, bool req, int sort, decimal min, decimal max) =>
        new() { ServiceTypeId = Guid.Empty, Key = key, LabelEn = en, LabelEs = es, Type = FormFieldType.Number, Required = req, SortOrder = sort, Min = min, Max = max };

    private static FormField Sel(string key, string en, string es, bool req, int sort, string options) =>
        new() { ServiceTypeId = Guid.Empty, Key = key, LabelEn = en, LabelEs = es, Type = FormFieldType.Select, Required = req, SortOrder = sort, Options = options };

    private static FormField Check(string key, string en, string es, bool req, int sort) =>
        new() { ServiceTypeId = Guid.Empty, Key = key, LabelEn = en, LabelEs = es, Type = FormFieldType.Checkbox, Required = req, SortOrder = sort };

    private static RequiredDocument D(string key, string en, string es, bool req, int sort) =>
        new() { ServiceTypeId = Guid.Empty, Key = key, LabelEn = en, LabelEs = es, Required = req, SortOrder = sort };

    private record DemoUsers(User Citizen, User Citizen2, User Officer, User Clerk, User Supervisor);
}
