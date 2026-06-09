import type { Transaction } from "@/lib/finance/store-client";
import type { IntelRecord } from "@/lib/intel/schema";

export type DemoLocale = "es" | "en";

export type FinanceDemoRow = Omit<Transaction, "id" | "ts"> & { dayAgo: number };

export function financeDemoRows(locale: DemoLocale): FinanceDemoRow[] {
  const es = locale === "es";
  const c = {
    informant: es ? "informante" : "informant",
    safehouse: es ? "alojamiento" : "safehouse",
    comms: es ? "comunicaciones" : "comms",
    transport: es ? "transporte" : "transport",
    meals: es ? "comida" : "meals",
    gear: es ? "equipo" : "gear",
    income: es ? "ingreso" : "income",
  };
  return [
    {
      dayAgo: 0,
      amount: 18.4,
      currency: "USDT",
      kind: "spend",
      category: c.meals,
      merchant: es ? "Cafe de la esquina" : "Corner Cafe",
      note: es ? "reunion de tapadera" : "cover meeting",
    },
    {
      dayAgo: 0,
      amount: 12000,
      currency: "sats",
      kind: "spend",
      category: c.comms,
      merchant: es ? "VPN sin logs" : "No-log VPN",
      note: es ? "pago Lightning" : "Lightning payment",
    },
    {
      dayAgo: 1,
      amount: 250,
      currency: "USDT",
      kind: "spend",
      category: c.informant,
      merchant: es ? 'Sujeto "Halcon"' : 'Subject "Falcon"',
      note: es ? "soplo verificado" : "verified tip",
    },
    {
      dayAgo: 2,
      amount: 42.75,
      currency: "USDT",
      kind: "spend",
      category: c.transport,
      merchant: es ? "Taxi nocturno" : "Night cab",
      note: es ? "vigilancia movil" : "mobile surveillance",
    },
    {
      dayAgo: 2,
      amount: 89.99,
      currency: "USDT",
      kind: "spend",
      category: c.gear,
      merchant: es ? "Telefono desechable" : "Burner phone",
    },
    {
      dayAgo: 3,
      amount: 1500,
      currency: "USDT",
      kind: "income",
      category: c.income,
      merchant: es ? "Estipendio de la Agencia" : "Agency stipend",
      note: es ? "asignacion de mision" : "mission allowance",
    },
    {
      dayAgo: 4,
      amount: 600,
      currency: "USDT",
      kind: "spend",
      category: c.safehouse,
      merchant: es ? "Piso franco - Distrito 7" : "Safehouse - District 7",
      note: es ? "renta semanal" : "weekly rent",
    },
    {
      dayAgo: 5,
      amount: 27.3,
      currency: "USDT",
      kind: "spend",
      category: c.meals,
      merchant: es ? "Mercado nocturno" : "Night market",
    },
    {
      dayAgo: 6,
      amount: 8500,
      currency: "sats",
      kind: "spend",
      category: c.informant,
      merchant: es ? "Contacto portuario" : "Dock contact",
      note: es ? "pago Lightning discreto" : "discreet Lightning payment",
    },
    {
      dayAgo: 7,
      amount: 64.0,
      currency: "USDT",
      kind: "spend",
      category: c.gear,
      merchant: es ? "Tienda de electronica" : "Electronics shop",
      note: es ? "cables y baterias" : "cables and batteries",
    },
    {
      dayAgo: 8,
      amount: 33.5,
      currency: "USDT",
      kind: "spend",
      category: c.transport,
      merchant: es ? "Alquiler de coche" : "Car rental",
    },
    {
      dayAgo: 9,
      amount: 175,
      currency: "USDT",
      kind: "spend",
      category: c.informant,
      merchant: es ? 'Sujeto "Cuervo"' : 'Subject "Raven"',
      note: es ? "documentos filtrados" : "leaked documents",
    },
  ];
}

export function intelDemoRecords(locale: DemoLocale, now: number): IntelRecord[] {
  const es = locale === "es";
  return [
    {
      id: "demo-rio-001",
      resumen: es
        ? "Contacto nocturno de Vector Gris con mensajero de Kestrel en el muelle sur."
        : "Night contact between Gray Vector and a Kestrel courier at the south pier.",
      amenaza: "ELEVADO",
      entidades: {
        personas: ["Vector Gris", "mensajero Kestrel"],
        organizaciones: ["Kestrel"],
        lugares: ["Muelle Sur", "Darsena 4"],
        fechas: [new Date(now - 86_400_000).toISOString().slice(0, 10)],
      },
      accionesPendientes: es
        ? ["Corroborar matricula del vehiculo", "Cruzar camaras del acceso este"]
        : ["Corroborate vehicle plate", "Cross-check east-access cameras"],
      datos: {
        sujeto: {
          alias: "Vector Gris",
          descripcion: es ? "operador logistico con escolta discreta" : "logistics operator with discreet escort",
          afiliacion: "Kestrel",
        },
        ubicacion: {
          lugar: "Muelle Sur",
          coordenadas: "-34.6037,-58.3816",
          contexto: es ? "intercambio bajo lluvia, sin ingreso a deposito" : "rainy exchange, no warehouse entry",
        },
        evaluacion: {
          fiabilidad: es ? "media-alta" : "medium-high",
          corroboracion: es ? "dos observadores y audio parcial" : "two observers and partial audio",
          riesgos: es ? ["seguimiento hostil", "contra-vigilancia"] : ["hostile tail", "counter-surveillance"],
        },
        narrativa: es
          ? "A las 23:40, Vector Gris recibio un sobre metalizado de un mensajero vinculado a Kestrel en Darsena 4."
          : "At 23:40, Gray Vector received a metallic envelope from a Kestrel-linked courier at Dock 4.",
      },
      transcripcion: es
        ? "Vector Gris llego por el acceso este, hizo contacto con el mensajero y se retiro hacia la avenida."
        : "Gray Vector arrived through the east access, made contact with the courier, and left toward the avenue.",
      metadatos: {
        kind: "contacto",
        sector: "Rio",
        capturedAt: now - 86_400_000,
        durationMs: 94_000,
        locale,
      },
      estado: "CONFIRMADO",
      createdAt: now - 86_400_000,
    },
    {
      id: "demo-clinica-002",
      resumen: es
        ? "Sujeto Alfa salio de la clinica San Telmo con vendaje y apoyo de un tercero."
        : "Subject Alpha exited San Telmo clinic with a bandage and third-party support.",
      amenaza: "CRITICO",
      entidades: {
        personas: ["Sujeto Alfa", "Dra. Marquez"],
        organizaciones: ["Clinica San Telmo"],
        lugares: ["Clinica San Telmo", "Pasaje Defensa"],
        fechas: [new Date(now - 43_200_000).toISOString().slice(0, 10)],
      },
      accionesPendientes: es
        ? ["Confirmar gravedad de la herida", "Identificar acompanante"]
        : ["Confirm injury severity", "Identify companion"],
      datos: {
        sujeto: {
          alias: "Sujeto Alfa",
          descripcion: es ? "varon, renguera visible, vendaje en antebrazo" : "male, visible limp, forearm bandage",
          afiliacion: es ? "sin confirmar" : "unconfirmed",
        },
        ubicacion: {
          lugar: "Clinica San Telmo",
          coordenadas: "-34.6197,-58.3712",
          contexto: es ? "salida lateral, traslado a vehiculo oscuro" : "side exit, transferred to dark vehicle",
        },
        evaluacion: {
          fiabilidad: "alta",
          corroboracion: es ? "foto y testigo presencial" : "photo and eyewitness",
          riesgos: es ? ["posible herida reciente", "extraccion medica"] : ["possible recent injury", "medical extraction"],
        },
        narrativa: es
          ? "El sujeto presentaba dolor, vendaje fresco y respiracion agitada; la acompanante evito el acceso principal."
          : "The subject showed pain, fresh bandage, and labored breathing; the companion avoided the main entrance.",
      },
      transcripcion: es
        ? "Alfa sale por lateral de la clinica, brazo derecho vendado, parece lesionado, sube a sedan negro."
        : "Alpha exits the clinic side door, right arm bandaged, appears injured, enters a black sedan.",
      metadatos: {
        kind: "incidente",
        sector: "San Telmo",
        capturedAt: now - 43_200_000,
        durationMs: 61_000,
        locale,
      },
      estado: "CONFIRMADO",
      createdAt: now - 43_200_000,
    },
    {
      id: "demo-boveda-003",
      resumen: es
        ? "Documento fotografiado menciona entrega aplazada de baterias cifradas a Kestrel."
        : "Photographed document mentions a delayed delivery of encrypted batteries to Kestrel.",
      amenaza: "ELEVADO",
      entidades: {
        personas: ["Nina", "Vector Gris"],
        organizaciones: ["Kestrel", "Taller Norte"],
        lugares: ["Taller Norte", "Darsena 4"],
        fechas: [new Date(now - 7_200_000).toISOString().slice(0, 10)],
      },
      accionesPendientes: es
        ? ["Revisar inventario del Taller Norte", "Preparar vigilancia en Darsena 4"]
        : ["Review North Workshop inventory", "Prepare surveillance at Dock 4"],
      datos: {
        sujeto: {
          alias: "Nina",
          descripcion: es ? "intermediaria de suministros tecnicos" : "technical supplies intermediary",
          afiliacion: "Taller Norte",
        },
        ubicacion: {
          lugar: "Taller Norte",
          coordenadas: "-34.5940,-58.4050",
          contexto: es ? "nota recuperada en mesa de embalaje" : "note recovered on packing table",
        },
        evaluacion: {
          fiabilidad: es ? "media" : "medium",
          corroboracion: es ? "OCR del documento y cruce con contacto previo" : "document OCR and prior contact cross-check",
          riesgos: es ? ["material cifrado", "entrega proxima"] : ["encrypted material", "near-term delivery"],
        },
        narrativa: es
          ? "La nota indica que el paquete de baterias cifradas se aplazo 24 horas y conserva destino Darsena 4."
          : "The note says the encrypted battery package slipped 24 hours and still targets Dock 4.",
      },
      transcripcion: es
        ? "OCR: baterias cifradas, entrega aplazada, contactar a Vector Gris antes de medianoche."
        : "OCR: encrypted batteries, delivery delayed, contact Gray Vector before midnight.",
      adjuntos: [
        {
          kind: "ocr",
          text: es
            ? "Baterias cifradas. Entrega aplazada 24h. Vector Gris confirma Darsena 4."
            : "Encrypted batteries. Delivery delayed 24h. Gray Vector confirms Dock 4.",
          sha256: "demo-ocr-boveda-003",
        },
      ],
      metadatos: {
        kind: "documento",
        sector: "Norte",
        capturedAt: now - 7_200_000,
        durationMs: null,
        locale,
      },
      estado: "CONFIRMADO",
      createdAt: now - 7_200_000,
    },
  ];
}
