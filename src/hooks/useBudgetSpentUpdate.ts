import { useEffect } from "react";
import { Budget } from "@/types/budget";
import { RevolutTransactionDB } from "@/types/revolut";
import { sumMonthlySpending } from "@/utils/budgetCalculations";
import { CATEGORIES } from "@/constants/budget";

export function useBudgetSpentUpdate(
  transactions: RevolutTransactionDB[] | undefined,
  budget: Budget,
  onUpdateSpent: (updatedBudget: Budget) => void,
  selectedMonth: number,
  selectedYear: number
) {
  useEffect(() => {
    if (transactions) {
      const monthlySpending = sumMonthlySpending(transactions);

      // Create updated budget with new spent amounts
      const updatedBudget: Budget = {
        ...budget,
        takeaway_coffee_spent: 0,
        uncategorized_spent: 0,
        rent_spent: 0,
        utilities_spent: 0,
        groceries_spent: 0,
        transport_spent: 0,
        entertainment_spent: 0,
        shopping_spent: 0,
        miscellaneous_spent: 0,
        savings_spent: 0,
        dining_out_spent: 0,
        health_fitness_spent: 0,
        personal_care_spent: 0,
        education_spent: 0,
        pubs_bars_spent: 0,
        clothing_apparel_spent: 0,
        home_hardware_spent: 0,
        travel_transportation_spent: 0,
        online_services_subscriptions_spent: 0,
        other_retail_spent: 0,
        money_transfer_spent: 0,
        gifts_donations_spent: 0,
        travel_spent: 0
      };

      // Map category sums to budget spent fields
      Object.entries(monthlySpending).forEach(([category, sum]) => {
        const budgetCategory = CATEGORIES.find(cat => cat.name === category);
        
        if (budgetCategory) {
          const spentKey = budgetCategory.spentKey as keyof Budget;
          updatedBudget[spentKey] = Number(sum);
        } else if (category === "Uncategorized") {
          updatedBudget.uncategorized_spent = Number(sum);
        }
      });

      // Update the budget with new spent amounts
      onUpdateSpent(updatedBudget);
    }
  }, [transactions, budget, onUpdateSpent, selectedMonth, selectedYear]);
}