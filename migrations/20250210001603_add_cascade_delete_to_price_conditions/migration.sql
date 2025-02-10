-- DropForeignKey
ALTER TABLE "PriceCondition" DROP CONSTRAINT "PriceCondition_paymentRuleId_fkey";

-- AddForeignKey
ALTER TABLE "PriceCondition" ADD CONSTRAINT "PriceCondition_paymentRuleId_fkey" FOREIGN KEY ("paymentRuleId") REFERENCES "PaymentRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
