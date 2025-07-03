import { screen, within } from "@testing-library/react";
import { store } from "./store.ts";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { expect, it, describe, beforeEach } from "vitest";
import { renderWithRedux } from "../../test/utils.tsx";

describe("render all App component", function () {
  it("should render App", () => {
    renderWithRedux(<App />);
    expect(screen.getByText(/Конвертер валют онлайн/i)).toBeInTheDocument();
  });

  it("should render 2 converters titles", () => {
    renderWithRedux(<App />);
    expect(screen.getByText(/у меня есть/i)).toBeInTheDocument();
    expect(screen.getByText(/хочу приобрести/i)).toBeInTheDocument();
  });

  it("should render 2 switchers", () => {
    const { container } = renderWithRedux(<App />);
    const switchers = container.querySelectorAll(".switcher");
    expect(switchers).toHaveLength(2);
  });

  it("should render 2 inputs", () => {
    renderWithRedux(<App />);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
  });

  it("should render reverse", () => {
    const { container } = renderWithRedux(<App />);
    const reverse = container.querySelector(".direction__reverse");
    expect(reverse).toBeInTheDocument();
  });

  it("should render 2 box rate", () => {
    renderWithRedux(<App />);
    expect(screen.getByText(/1 RUR = /i)).toBeInTheDocument();
    expect(screen.getByText(/1 USD = /i)).toBeInTheDocument();
  });
});

describe("application functionality", () => {
  beforeEach(() => {
    store.dispatch({ type: "currencies/reset" });
  });

  it("should be disabled second input ", () => {
    renderWithRedux(<App />);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs[1]).toBeDisabled();
  });

  it("should render default input values: 100 and 1.28", async () => {
    renderWithRedux(<App />);
    expect(await screen.findByDisplayValue(100)).toBeInTheDocument();
    expect(await screen.findByDisplayValue(1.28)).toBeInTheDocument();
  });

  it("should render 200 and 2.55 when user types in the first input", async () => {
    renderWithRedux(<App />);
    const firstInput = await screen.findByDisplayValue(100);
    const secondInput = await screen.findByDisplayValue(1.28);

    await userEvent.clear(firstInput);
    await userEvent.type(firstInput, "200");

    expect(firstInput).toHaveDisplayValue("200");
    expect(secondInput).toHaveDisplayValue("2.55");
  });

  it("should clear all input fields when the first input is cleared", async () => {
    renderWithRedux(<App />);

    const firstInput = await screen.findByDisplayValue(100);
    const secondInput = await screen.findByDisplayValue(1.28);

    await userEvent.clear(firstInput);

    expect(firstInput).toHaveDisplayValue("");
    expect(secondInput).toHaveDisplayValue("");
  });

  it("should reverse currencies and update active switchers and input values", async () => {
    const { container } = renderWithRedux(<App />);

    const reverse = container.querySelector(".direction__reverse");

    if (!reverse) {
      throw new Error("Reverse button not found");
    }

    const switchers = container.querySelectorAll(".switcher");
    const firstSwitcher = switchers[0] as HTMLElement;
    const secondSwitcher = switchers[1] as HTMLElement;
    const firstInput = await screen.findByDisplayValue(100);
    const secondInput = await screen.findByDisplayValue(1.28);

    await userEvent.click(reverse);

    expect(firstInput).toHaveDisplayValue("100");
    expect(secondInput).not.toHaveDisplayValue("1.55");

    const rurInFirst = await within(firstSwitcher).findByText("RUR");
    const rurInSecond = await within(secondSwitcher).findByText("RUR");
    const usdInFirst = await within(firstSwitcher).findByText("USD");
    const usdInSecond = await within(secondSwitcher).findByText("USD");

    expect(rurInFirst).not.toHaveClass("active");
    expect(rurInSecond).toHaveClass("active");
    expect(usdInSecond).not.toHaveClass("active");
    expect(usdInFirst).toHaveClass("active");
  });

  it("should set identical inputs when RUR selected in second switcher", async () => {
    const { container } = renderWithRedux(<App />);

    const switchers = container.querySelectorAll(".switcher");
    const secondSwitcher = switchers[1] as HTMLElement;

    const rurInSecond = await within(secondSwitcher).findByText("RUR");
    await userEvent.click(rurInSecond);

    expect(await screen.findByDisplayValue("100.00")).toBeInTheDocument();
  });

  it("should set identical inputs when both switchers select CAD", async () => {
    const { container } = renderWithRedux(<App />);

    const switchers = container.querySelectorAll(".switcher");
    const firstSwitcher = switchers[0] as HTMLElement;
    const secondSwitcher = switchers[1] as HTMLElement;

    const cadInFirst = await within(firstSwitcher).findByText("CAD");
    const cadInSecond = await within(secondSwitcher).findByText("CAD");

    await userEvent.click(cadInFirst);
    await userEvent.click(cadInSecond);

    expect(await screen.findByDisplayValue("100")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("100.00")).toBeInTheDocument();
  });
});
