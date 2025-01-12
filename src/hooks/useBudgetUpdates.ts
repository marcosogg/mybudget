import { useState } from "react";
import { Budget } from "@/types/budget";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/constants/budget";

export function useBudgetUpdates(
  editedBudget: Budget,
  budgetId: string,
  setIsEditing: (value: boolean) => void,
  onUpdateSpent: (updatedBudget: Budget) => void
) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Create an object with only the spent fields
      const updates = Object.fromEntries(
        CATEGORIES.map((cat) => [
          cat.spentKey,
          Number(editedBudget[cat.spentKey as keyof Budget]) || 0,
        ])
      );

      const { error } = await supabase
        .from("budgets")
        .update(updates)
        .eq("id", budgetId);

      if (error) throw error;

      // Update the parent component's state
      onUpdateSpent(editedBudget);
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Budget updated successfully",
      });
    } catch (error) {
      console.error("Error updating budget:", error);
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    handleSave,
    isSaving,
  };
}
