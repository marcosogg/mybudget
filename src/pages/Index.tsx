import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import MonthYearPicker from "@/components/MonthYearPicker";
import BudgetSummary from "@/components/BudgetSummary";
import { BillRemindersCard } from "@/components/BillRemindersCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BudgetCards } from "@/components/dashboard/BudgetCards";
import type { Budget } from "@/types/budget";

export default function Index() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchBudget = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to view budgets",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", selectedMonth)
        .eq("year", selectedYear)
        .maybeSingle();

      if (error) throw error;
      setBudget(data);
    } catch (error) {
      console.error("Error fetching budget:", error);
      toast({
        title: "Error",
        description: "Failed to fetch budget data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [selectedMonth, selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleUpdateSpent = (updatedBudget: Budget) => {
    setBudget(updatedBudget);
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader />

        <MonthYearPicker
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : budget ? (
          <div className="space-y-6">
            <BudgetSummary
              totalIncome={budget.salary + budget.bonus}
              salary={budget.salary}
              bonus={budget.bonus}
            />
            <BudgetCards 
              budget={budget}
              formatCurrency={formatCurrency}
              onUpdateSpent={handleUpdateSpent}
            />
            <BillRemindersCard />
          </div>
        ) : (
          <Card className="bg-white/10 backdrop-blur-lg text-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg mb-4">No budget found for this month</p>
              <Button 
                onClick={() => navigate("/createbudget")}
                className="bg-white text-indigo-600 hover:bg-gray-100"
              >
                Create Budget
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}