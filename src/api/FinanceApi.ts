// src/api/financeApi.ts
import { supabase } from "./supabaseClient";

export interface Expense {
  id: number;
  occurred_on: string; // yyyy-mm-dd
  category: string;
  description: string | null;
  amount: number;
  payment_method: "cash" | "qris" | "transfer" | null;
}

export interface OtherIncome {
  id: number;
  occurred_on: string;
  source: string;
  description: string | null;
  amount: number;
}

export type ExpenseInput = Omit<Expense, "id">;
export type OtherIncomeInput = Omit<OtherIncome, "id">;

/** Ambil pengeluaran dalam rentang tanggal (inklusif). */
export async function getExpenses(
  startDate: string,
  endDate: string,
): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .gte("occurred_on", startDate)
    .lte("occurred_on", endDate)
    .order("occurred_on", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) }));
}

export async function createExpense(payload: ExpenseInput): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return { ...data, amount: Number(data.amount) };
}

export async function updateExpense(
  id: number,
  payload: Partial<ExpenseInput>,
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return { ...data, amount: Number(data.amount) };
}

export async function deleteExpense(id: number): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) throw error;
}

/** Pemasukan non-penjualan (modal, titipan, dsb). */
export async function getOtherIncomes(
  startDate: string,
  endDate: string,
): Promise<OtherIncome[]> {
  const { data, error } = await supabase
    .from("other_incomes")
    .select("*")
    .gte("occurred_on", startDate)
    .lte("occurred_on", endDate)
    .order("occurred_on", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) }));
}

export async function createOtherIncome(
  payload: OtherIncomeInput,
): Promise<OtherIncome> {
  const { data, error } = await supabase
    .from("other_incomes")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return { ...data, amount: Number(data.amount) };
}

export async function deleteOtherIncome(id: number): Promise<void> {
  const { error } = await supabase.from("other_incomes").delete().eq("id", id);

  if (error) throw error;
}

export async function getExpenseCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("name")
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row) => row.name as string);
}