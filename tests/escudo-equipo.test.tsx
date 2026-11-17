import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { EscudoEquipo } from "@/components/equipos/escudo-equipo";

it("conserva el diseño del nombre y distingue visualmente a equipos homónimos", () => {
  render(
    <>
      <EscudoEquipo nombre="Leones FC" id={7} />
      <EscudoEquipo nombre="Leones FC" id={19} />
      <EscudoEquipo nombre="Cobras FC" id={20} />
    </>,
  );

  const primero = screen.getByRole("img", { name: "Escudo de Leones FC, equipo 7" });
  const segundo = screen.getByRole("img", { name: "Escudo de Leones FC, equipo 19" });
  const cobras = screen.getByRole("img", { name: "Escudo de Cobras FC, equipo 20" });

  expect(primero.getAttribute("style")).toBe(segundo.getAttribute("style"));
  expect(primero).toHaveTextContent("🦁LEO7");
  expect(segundo).toHaveTextContent("🦁LEO19");
  expect(cobras).toHaveTextContent("🐍COB20");
  expect(cobras.getAttribute("style")).not.toBe(primero.getAttribute("style"));
});

it("muestra imágenes distintas del catálogo para los dos Leones FC registrados", () => {
  render(
    <>
      <EscudoEquipo nombre="Leones FC" id={2} />
      <EscudoEquipo nombre="Leones FC" id={29} />
    </>,
  );

  expect(screen.getByRole("img", { name: "Escudo de Leones FC, equipo 2" }))
    .toHaveAttribute("src", "/logos-equipos/048.png");
  expect(screen.getByRole("img", { name: "Escudo de Leones FC, equipo 29" }))
    .toHaveAttribute("src", "/logos-equipos/049.png");
});
