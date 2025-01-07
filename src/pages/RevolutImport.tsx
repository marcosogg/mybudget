import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import FileUploadZone from "@/components/revolut/FileUploadZone";
import TransactionsTable from "@/components/revolut/TransactionsTable";
import type { RevolutTransaction } from "@/types/revolut";
import { supabase } from "@/integrations/supabase/client";
import { parse, format } from "date-fns";

export default function RevolutImport() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<RevolutTransaction[]>([]);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await file.text();
      const rows = text.split('\n');
      
      // Remove header row and parse remaining rows
      const header = rows[0].split(',');
      const parsedTransactions = rows.slice(1)
        .filter(row => row.trim()) // Skip empty rows
        .map(row => {
          const values = row.split(',');
          
          // Parse the completed date string into a Date object
          // Revolut typically uses format: "2024-01-07 12:34:56"
          const completedDateStr = values[3].trim().replace(/"/g, ''); // Remove any quotes
          let parsedDate;
          
          try {
            // Try parsing with different date formats
            parsedDate = parse(completedDateStr, 'yyyy-MM-dd HH:mm:ss', new Date());
            if (isNaN(parsedDate.getTime())) {
              // Try alternative format if first attempt fails
              parsedDate = parse(completedDateStr, 'dd-MM-yyyy HH:mm:ss', new Date());
            }
          } catch (error) {
            console.error('Error parsing date:', completedDateStr, error);
            // If parsing fails, use current date as fallback
            parsedDate = new Date();
          }

          // Format amount: remove currency symbol and convert to number
          const rawAmount = values[5].replace(/[^-0-9.]/g, '');
          const amount = parseFloat(rawAmount) || 0;

          return {
            type: values[0]?.trim() || '',
            product: values[1]?.trim() || '',
            startedDate: values[2]?.trim() || '',
            completedDate: values[3]?.trim() || '',
            description: values[4]?.trim() || '',
            amount: amount,
            fee: values[6]?.trim() || '',
            currency: values[7]?.trim() || '',
            state: values[8]?.trim() || '',
            balance: values[9]?.trim() || '',
          };
        });

      // Store transactions in Supabase
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase.from('revolut_transactions').insert(
        parsedTransactions.map(t => ({
          date: format(parse(t.completedDate, 'yyyy-MM-dd HH:mm:ss', new Date()), 'yyyy-MM-dd'),
          description: t.description,
          amount: t.amount,
          currency: t.currency,
          profile_id: user.user.id
        }))
      );

      if (error) {
        throw error;
      }

      setTransactions(parsedTransactions);
      
      toast({
        title: "File processed",
        description: `Successfully processed ${parsedTransactions.length} transactions`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process the file. Please check the date format in your CSV.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Import Revolut Statement</h1>
      <FileUploadZone isProcessing={isProcessing} onFileUpload={processFile} />
      {transactions.length > 0 && <TransactionsTable transactions={transactions} />}
    </div>
  );
}