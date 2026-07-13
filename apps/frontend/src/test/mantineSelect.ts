import { screen } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";

export async function selectMantineOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string | RegExp,
  optionText: string,
): Promise<void> {
  const input = screen.getByRole("textbox", { name: label });
  await user.click(input);
  await user.type(input, optionText);
  const option = await screen.findByRole("option", { name: optionText });
  await user.click(option);
}
