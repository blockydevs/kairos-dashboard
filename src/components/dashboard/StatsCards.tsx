import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function StatsCards({ balance }: { balance: string | number }) {
  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <p className="text-2xl font-semibold">Total balance {balance.toLocaleString()} USD</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CAGR</CardTitle>
          <CardDescription>Compound Annual Growth Rate</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <p className="text-xl font-semibold">9.32%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hit Rate</CardTitle>
          <CardDescription>Successful Trades</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <p className="text-xl font-semibold">68%</p>
        </CardContent>
      </Card>
    </div>
  );
}
