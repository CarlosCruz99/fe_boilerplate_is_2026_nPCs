import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarioOrganizador } from "@/app/organizador/calendario/calendario-organizador";
import Page from "@/app/organizador/calendario/page";
import * as api from "@/app/actions/calendario-organizador";
import { useAuth } from "@/contexts/auth-context";
import type {
  JornadaOrganizador,
  PartidoOrganizador,
  CatalogosCalendario,
  Partido,
} from "@/types/calendario-organizador";

vi.mock("@/app/actions/calendario-organizador", () => ({
  temporadasCalendario: vi.fn(),
  catalogosCalendario: vi.fn(),
  generarCalendario: vi.fn(),
  agendarPartido: vi.fn(),
  reprogramarPartido: vi.fn(),
  cancelarPartido: vi.fn(),
  consultarCalendario: vi.fn(),
  publicarJornada: vi.fn(),
}));
vi.mock("@/contexts/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
const arbitro = {
  id: "00000000-0000-4000-8000-000000000012",
  nombre: "Carlos Mena",
};
const catalogos: CatalogosCalendario = {
  equipos: Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    nombre: `Equipo ${i + 1}`,
    estado: "INSCRITO",
    nombreCapitan: `Capitán ${i + 1}`,
    totalJugadores: 7,
    creadoEn: "2026-01-01T00:00:00Z",
  })),
  totalInscritos: 12,
  canchas: [
    { id: 1, nombre: "Cancha 1", direccion: "San Salvador", activa: true },
  ],
  arbitros: [arbitro],
};
const partido: Partido = {
  id: 70,
  jornada: 1,
  equipoLocalId: 1,
  equipoVisitanteId: 2,
  canchaId: 1,
  arbitroId: arbitro.id,
  inicio: "2035-02-10T14:00:00Z",
  fin: "2035-02-10T15:30:00Z",
  estado: "PROGRAMADO",
};
let jornadasPorTemporada: Record<number, JornadaOrganizador[]>;
function completo(p: Partido): PartidoOrganizador {
  return {
    ...p,
    local: { id: p.equipoLocalId, nombre: `Equipo ${p.equipoLocalId}` },
    visitante: {
      id: p.equipoVisitanteId,
      nombre: `Equipo ${p.equipoVisitanteId}`,
    },
    cancha: catalogos.canchas[0],
    arbitro,
  };
}
function guardarFixture(p: Partido) {
  const actual = jornadasPorTemporada[1] ?? [];
  const jornada = actual.find((j) => j.numero === p.jornada);
  if (jornada)
    jornada.partidos = [
      ...jornada.partidos.filter((v) => v.id !== p.id),
      completo(p),
    ];
  else
    actual.push({
      id: 90 + p.jornada,
      numero: p.jornada,
      estado: "BORRADOR",
      publicadaEn: null,
      partidos: [completo(p)],
    });
  jornadasPorTemporada[1] = actual;
}
beforeEach(() => {
  vi.resetAllMocks();
  jornadasPorTemporada = {};
  vi.mocked(api.consultarCalendario).mockImplementation(async (id) => ({
    ok: true,
    data: {
      temporadaId: id,
      jornadas: structuredClone(jornadasPorTemporada[id] ?? []),
    },
  }));
  vi.mocked(api.agendarPartido).mockImplementation(async () => {
    guardarFixture(partido);
    return { ok: true, data: partido };
  });
  vi.mocked(api.publicarJornada).mockImplementation(async (id) => {
    const j = Object.values(jornadasPorTemporada)
      .flat()
      .find((j) => j.id === id)!;
    j.estado = "PUBLICADA";
    j.publicadaEn = "2026-11-09T00:00:00Z";
    return {
      ok: true,
      data: { id, estado: "PUBLICADA", publicadaEn: j.publicadaEn },
    };
  });
  vi.mocked(api.temporadasCalendario).mockResolvedValue({
    ok: true,
    data: [
      { id: 1, nombre: "Apertura", actual: true, inscripcionAbierta: false },
      { id: 2, nombre: "Clausura", actual: false, inscripcionAbierta: false },
    ],
  });
  vi.mocked(api.catalogosCalendario).mockResolvedValue({
    ok: true,
    data: catalogos,
  });
  vi.mocked(useAuth).mockReturnValue({
    estado: "autenticado",
    usuario: {
      id: "u1",
      nombre: "Capitán",
      email: "c@test.sv",
      rol: "JUGADOR",
      equipoActualId: 1,
      capitaneaEquipoId: 1,
    },
    rol: "JUGADOR",
    equipoActualId: 1,
    capitaneaEquipoId: 1,
    mensaje: null,
    actualizarSesion: vi.fn(),
  });
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
async function prepararPartido() {
  const form = await screen.findByRole("form", { name: "Agendar partido" });
  await userEvent.selectOptions(
    within(form).getByLabelText("Equipo local"),
    "1",
  );
  await userEvent.selectOptions(
    within(form).getByLabelText("Equipo visitante"),
    "2",
  );
  await userEvent.selectOptions(within(form).getByLabelText("Cancha"), "1");
  await userEvent.selectOptions(
    within(form).getByLabelText("Árbitro"),
    arbitro.id,
  );
  fireEvent.change(within(form).getByLabelText("Fecha (El Salvador)"), {
    target: { value: "2035-02-10" },
  });
  fireEvent.change(within(form).getByLabelText("Hora (El Salvador)"), {
    target: { value: "08:00" },
  });
  return form;
}
async function prepararGeneracion() {
  const form = await screen.findByRole("form", { name: "Generar calendario" });
  fireEvent.change(within(form).getByLabelText("Fecha de la primera jornada"), {
    target: { value: "2035-02-10" },
  });
  await userEvent.click(within(form).getByLabelText("Cancha 1"));
  await userEvent.click(within(form).getByLabelText(arbitro.nombre));
  await userEvent.click(
    within(form).getByRole("button", { name: /Generar calendario/ }),
  );
  return screen.getByRole("dialog");
}
describe("FE-3.1 calendario", () => {
  it("recupera 11 jornadas con 6 partidos y conserva el estado al volver a entrar", async () => {
    jornadasPorTemporada[1] = Array.from({ length: 11 }, (_, i) => ({
      id: 100 + i,
      numero: i + 1,
      estado: i === 0 ? "PUBLICADA" : "BORRADOR",
      publicadaEn: i === 0 ? "2026-11-09T00:00:00Z" : null,
      partidos: Array.from({ length: 6 }, (_, k) =>
        completo({ ...partido, id: i * 6 + k + 1, jornada: i + 1 }),
      ),
    }));
    const vista = render(<CalendarioOrganizador />);
    await screen.findByText("Jornada 1 · Publicada · 6 partidos");
    expect(
      screen.getAllByText(/Jornada \d+ · (Borrador|Publicada) · 6 partidos/),
    ).toHaveLength(11);
    expect(
      screen.queryByRole("button", { name: "Publicar jornada 1" }),
    ).not.toBeInTheDocument();
    vista.unmount();
    render(<CalendarioOrganizador />);
    expect(
      await screen.findByText("Jornada 1 · Publicada · 6 partidos"),
    ).toBeInTheDocument();
  });
  it("publica usando el id real y retira el botón después de consultar", async () => {
    guardarFixture(partido);
    render(<CalendarioOrganizador />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Publicar jornada 1" }),
    );
    expect(
      screen.getByText(
        "Los capitanes recibirán un aviso. ¿Publicar la jornada 1?",
      ),
    ).toBeInTheDocument();
    expect(api.publicarJornada).not.toHaveBeenCalled();
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Confirmar",
      }),
    );
    await screen.findByText("Jornada publicada.");
    await screen.findByText("Jornada 1 · Publicada · 1 partidos");
    expect(api.publicarJornada).toHaveBeenCalledWith(91);
    expect(
      screen.queryByRole("button", { name: "Publicar jornada 1" }),
    ).not.toBeInTheDocument();
    expect(api.consultarCalendario).toHaveBeenCalledTimes(2);
  });
  it("recarga el estado ante 409 de publicación", async () => {
    guardarFixture(partido);
    vi.mocked(api.publicarJornada).mockImplementation(async () => {
      jornadasPorTemporada[1][0].estado = "PUBLICADA";
      return { ok: false, status: 409, error: "La jornada ya está publicada." };
    });
    render(<CalendarioOrganizador />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Publicar jornada 1" }),
    );
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Confirmar",
      }),
    );
    await screen.findByText("La jornada ya está publicada.");
    await screen.findByText("Jornada 1 · Publicada · 1 partidos");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(api.consultarCalendario).toHaveBeenCalledTimes(2);
  });
  it("conserva el diálogo y no anuncia publicación si el servicio falla", async () => {
    guardarFixture(partido);
    vi.mocked(api.publicarJornada).mockResolvedValue({
      ok: false,
      status: 503,
      error: "No pudimos publicar la jornada. Intenta de nuevo.",
    });
    render(<CalendarioOrganizador />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Publicar jornada 1" }),
    );
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Confirmar",
      }),
    );
    expect(
      await screen.findByText(
        "No pudimos publicar la jornada. Intenta de nuevo.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("Jornada publicada.")).not.toBeInTheDocument();
  });
  it("no permite publicar jornadas vacías y no muestra errores de lectura como vacíos", async () => {
    vi.mocked(api.consultarCalendario).mockResolvedValueOnce({
      ok: false,
      status: 503,
      error: "Consulta no disponible",
    });
    render(<CalendarioOrganizador />);
    await screen.findByText("Consulta no disponible");
    expect(screen.queryByText(/Aún no hay jornadas/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generar calendario (12 de 12)" }),
    ).toBeDisabled();
    jornadasPorTemporada[1] = [
      {
        id: 91,
        numero: 1,
        estado: "BORRADOR",
        publicadaEn: null,
        partidos: [],
      },
    ];
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(
      await screen.findByRole("button", { name: "Publicar jornada 1" }),
    ).toBeDisabled();
  });
  it("bloquea ambos flujos durante la publicación", async () => {
    guardarFixture(partido);
    let resolver!: (
      value: Awaited<ReturnType<typeof api.publicarJornada>>,
    ) => void;
    vi.mocked(api.publicarJornada).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve;
        }),
    );
    render(<CalendarioOrganizador />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Publicar jornada 1" }),
    );
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Confirmar",
      }),
    );
    expect(
      screen.getByRole("button", { name: "Procesando..." }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cancelar partido 70" }),
    ).toBeDisabled();
    resolver({
      ok: true,
      data: {
        id: 91,
        estado: "PUBLICADA",
        publicadaEn: "2026-11-09T00:00:00Z",
      },
    });
    await screen.findByText("Jornada publicada.");
  });

  it("conserva la selección de generación cuando el backend devuelve 422", async () => {
    vi.mocked(api.generarCalendario).mockResolvedValue({
      ok: false,
      status: 422,
      error: "Faltan 2 equipos inscritos para generar el calendario.",
    });
    render(<CalendarioOrganizador />);
    const dialog = await prepararGeneracion();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Confirmar" }),
    );
    expect(
      await screen.findByText(
        "Faltan 2 equipos inscritos para generar el calendario.",
      ),
    ).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Volver" }),
    );
    expect(screen.getByLabelText("Fecha de la primera jornada")).toHaveValue(
      "2035-02-10",
    );
    expect(screen.getByLabelText("Cancha 1")).toBeChecked();
    expect(screen.getByLabelText(arbitro.nombre)).toBeChecked();
  });
  it("bloquea acciones cuando faltan canchas y árbitros", async () => {
    vi.mocked(api.catalogosCalendario).mockResolvedValue({
      ok: true,
      data: { ...catalogos, canchas: [], arbitros: [] },
    });
    render(<CalendarioOrganizador />);
    expect(
      await screen.findByText("No hay canchas activas disponibles."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No hay árbitros disponibles."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generar calendario (12 de 12)" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Guardar partido" }),
    ).toBeDisabled();
  });

  it("deniega acceso al capitán sin pedir datos", () => {
    render(<Page />);
    expect(screen.getByRole("alert")).toHaveTextContent("No tienes permiso");
    expect(api.temporadasCalendario).not.toHaveBeenCalled();
  });
  it("muestra carga y permite reintentar errores de consulta", async () => {
    vi.mocked(api.temporadasCalendario).mockResolvedValueOnce({
      ok: false,
      status: 503,
      error: "Sin conexión",
    });
    render(<CalendarioOrganizador />);
    expect(screen.getByText("Cargando temporadas...")).toBeInTheDocument();
    await screen.findByText("Sin conexión");
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByText("Generar calendario de ida");
  });
  it("muestra estado vacío cuando el servidor no tiene jornadas", async () => {
    render(<CalendarioOrganizador />);
    expect(
      await screen.findByText(
        "Aún no hay jornadas en esta temporada. Genera el calendario o agenda el primer partido.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Publicar/ }),
    ).not.toBeInTheDocument();
  });
  it("deshabilita generación e indica faltantes con 10 inscritos", async () => {
    vi.mocked(api.catalogosCalendario).mockResolvedValue({
      ok: true,
      data: {
        ...catalogos,
        equipos: catalogos.equipos.slice(0, 10),
        totalInscritos: 10,
      },
    });
    render(<CalendarioOrganizador />);
    expect(
      await screen.findByRole("button", {
        name: "Generar calendario (10 de 12)",
      }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "Faltan 2 equipos inscritos para generar el calendario.",
      ),
    ).toBeInTheDocument();
  });
  it("excluye al local de visitantes y exige un árbitro", async () => {
    render(<CalendarioOrganizador />);
    const form = await prepararPartido();
    expect(
      within(within(form).getByLabelText("Equipo visitante")).queryByRole(
        "option",
        { name: "Equipo 1" },
      ),
    ).not.toBeInTheDocument();
    await userEvent.selectOptions(within(form).getByLabelText("Árbitro"), "");
    await userEvent.click(
      within(form).getByRole("button", { name: "Guardar partido" }),
    );
    expect(api.agendarPartido).not.toHaveBeenCalled();
  });
  it("confirma generación y vuelve a consultar las jornadas guardadas", async () => {
    vi.mocked(api.generarCalendario).mockImplementation(async () => {
      jornadasPorTemporada[1] = Array.from({ length: 11 }, (_, i) => ({
        id: 100 + i,
        numero: i + 1,
        estado: "BORRADOR",
        publicadaEn: null,
        partidos: Array.from({ length: 6 }, (_, k) =>
          completo({ ...partido, id: i * 6 + k + 1, jornada: i + 1 }),
        ),
      }));
      return {
        ok: true,
        data: {
          temporadaId: 1,
          jornadas: 11,
          partidos: 66,
          estadoJornadas: "BORRADOR",
        },
      };
    });
    render(<CalendarioOrganizador />);
    const dialog = await prepararGeneracion();
    expect(api.generarCalendario).not.toHaveBeenCalled();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Confirmar" }),
    );
    expect(
      await screen.findByText(
        "Calendario generado: 66 partidos en 11 jornadas.",
      ),
    ).toBeInTheDocument();
    await screen.findByText("Jornada 1 · Borrador · 6 partidos");
    expect(
      screen.getAllByText(/Jornada \d+ · Borrador · 6 partidos/),
    ).toHaveLength(11);
    await waitFor(() =>
      expect(api.consultarCalendario).toHaveBeenCalledTimes(2),
    );
  });
  it("bloquea reenvíos mientras genera", async () => {
    let resolver!: (
      value: Awaited<ReturnType<typeof api.generarCalendario>>,
    ) => void;
    vi.mocked(api.generarCalendario).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve;
        }),
    );
    render(<CalendarioOrganizador />);
    const dialog = await prepararGeneracion();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Confirmar" }),
    );
    expect(
      within(dialog).getByRole("button", { name: "Procesando..." }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Temporada")).toBeDisabled();
    resolver({
      ok: true,
      data: {
        temporadaId: 1,
        jornadas: 11,
        partidos: 66,
        estadoJornadas: "BORRADOR",
      },
    });
    await screen.findByText("Calendario generado: 66 partidos en 11 jornadas.");
    expect(api.generarCalendario).toHaveBeenCalledTimes(1);
  });
  it("agenda con zona explícita y conserva los partidos al cambiar de temporada", async () => {
    render(<CalendarioOrganizador />);
    const form = await prepararPartido();
    expect(within(form).getByText(/Fin calculado/)).toHaveTextContent("09:30");
    await userEvent.click(
      within(form).getByRole("button", { name: "Guardar partido" }),
    );
    await screen.findByText("Partido agendado.");
    expect(api.agendarPartido).toHaveBeenCalledWith(
      expect.objectContaining({
        inicio: "2035-02-10T08:00:00-06:00",
        temporadaId: 1,
      }),
    );
    await userEvent.selectOptions(screen.getByLabelText("Temporada"), "2");
    await screen.findByText(
      "Aún no hay jornadas en esta temporada. Genera el calendario o agenda el primer partido.",
    );
    await userEvent.selectOptions(screen.getByLabelText("Temporada"), "1");
    expect(
      await screen.findByRole("button", { name: "Reprogramar partido 70" }),
    ).toBeInTheDocument();
  });
  it.each([
    [409, "Esa cancha ya tiene un partido en ese horario."],
    [409, "Ese árbitro ya tiene un partido en ese horario."],
    [409, "Esos equipos ya se enfrentan en la temporada."],
    [422, "Equipo 1 ya tiene un partido esa semana."],
    [422, "El usuario elegido no es árbitro."],
    [503, "No pudimos guardar el partido. Intenta de nuevo."],
  ])("conserva los campos ante error %s: %s", async (status, error) => {
    vi.mocked(api.agendarPartido).mockResolvedValue({
      ok: false,
      status,
      error,
    });
    render(<CalendarioOrganizador />);
    const form = await prepararPartido();
    await userEvent.click(
      within(form).getByRole("button", { name: "Guardar partido" }),
    );
    expect(await screen.findByText(error)).toBeInTheDocument();
    expect(within(form).getByLabelText("Equipo local")).toHaveValue("1");
    expect(within(form).getByLabelText("Hora (El Salvador)")).toHaveValue(
      "08:00",
    );
  });
  it("reprograma sin editar equipos y cancela con confirmación", async () => {
    vi.mocked(api.reprogramarPartido).mockImplementation(async () => {
      const actualizado = {
        ...partido,
        inicio: "2035-02-10T16:00:00Z",
        fin: "2035-02-10T17:30:00Z",
      };
      guardarFixture(actualizado);
      return { ok: true, data: actualizado };
    });
    vi.mocked(api.cancelarPartido).mockImplementation(async () => {
      const actualizado: Partido = { ...partido, estado: "CANCELADO" };
      guardarFixture(actualizado);
      return { ok: true, data: actualizado };
    });
    render(<CalendarioOrganizador />);
    const form = await prepararPartido();
    await userEvent.click(
      within(form).getByRole("button", { name: "Guardar partido" }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Reprogramar partido 70" }),
    );
    const edit = screen.getByRole("form", { name: "Reprogramar partido" });
    expect(
      within(edit).queryByLabelText("Equipo local"),
    ).not.toBeInTheDocument();
    fireEvent.change(within(edit).getByLabelText("Hora (El Salvador)"), {
      target: { value: "10:00" },
    });
    await userEvent.click(
      within(edit).getByRole("button", { name: "Guardar cambios" }),
    );
    await screen.findByText("Partido reprogramado.");
    await userEvent.click(
      screen.getByRole("button", { name: "Cancelar partido 70" }),
    );
    expect(api.cancelarPartido).not.toHaveBeenCalled();
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Confirmar",
      }),
    );
    expect(await screen.findByText("Estado: Cancelado")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reprogramar partido 70" }),
    ).not.toBeInTheDocument();
  });
  it("muestra el conflicto al cancelar En curso sin retirar el partido", async () => {
    vi.mocked(api.cancelarPartido).mockResolvedValue({
      ok: false,
      status: 409,
      error: "No se puede cambiar de ‘En curso’ a ‘Cancelado’.",
    });
    render(<CalendarioOrganizador />);
    const form = await prepararPartido();
    await userEvent.click(
      within(form).getByRole("button", { name: "Guardar partido" }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Cancelar partido 70" }),
    );
    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Confirmar",
      }),
    );
    expect(
      await screen.findByText(
        "No se puede cambiar de ‘En curso’ a ‘Cancelado’.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Estado: Programado")).toBeInTheDocument();
  });
});
