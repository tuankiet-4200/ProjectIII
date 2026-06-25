import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SePayPgClient } from 'sepay-pg-node';

type SepayEnv = 'sandbox' | 'production';
type SepayPaymentMethod = 'BANK_TRANSFER' | 'NAPAS_BANK_TRANSFER';

export interface SepayPaymentRequest {
  orderId: string;
  amount: number;
  description: string;
  customerId: string;
}

export interface SepayPaymentPayload {
  provider: 'SEPAY';
  checkoutUrl: string;
  fields: Record<string, string | number | undefined>;
}

@Injectable()
export class SepayCheckoutService {
  constructor(private readonly configService: ConfigService) {}

  private createClient() {
    const merchantId = this.configService.get<string>('SEPAY_MERCHANT_ID');
    const secretKey = this.configService.get<string>('SEPAY_SECRET_KEY');
    const env = this.configService.get<SepayEnv>('SEPAY_ENV') || 'sandbox';

    if (!merchantId || !secretKey) {
      throw new InternalServerErrorException(
        'SePay credentials are not configured',
      );
    }

    return new SePayPgClient({
      env,
      merchant_id: merchantId,
      secret_key: secretKey,
    });
  }

  private appendOrderId(url: string | undefined, orderId: string) {
    if (!url) return undefined;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}order_id=${encodeURIComponent(orderId)}`;
  }

  createPayment(request: SepayPaymentRequest): SepayPaymentPayload {
    const paymentMethod =
      this.configService.get<SepayPaymentMethod>('SEPAY_PAYMENT_METHOD') ||
      'BANK_TRANSFER';
    const client = this.createClient();

    const fields = client.checkout.initOneTimePaymentFields({
      operation: 'PURCHASE',
      payment_method: paymentMethod,
      order_invoice_number: request.orderId,
      order_amount: request.amount,
      currency: 'VND',
      order_description: request.description,
      customer_id: request.customerId,
      success_url: this.appendOrderId(
        this.configService.get<string>('SEPAY_SUCCESS_URL'),
        request.orderId,
      ),
      error_url: this.appendOrderId(
        this.configService.get<string>('SEPAY_ERROR_URL'),
        request.orderId,
      ),
      cancel_url: this.appendOrderId(
        this.configService.get<string>('SEPAY_CANCEL_URL'),
        request.orderId,
      ),
      custom_data: JSON.stringify({ parent_order_id: request.orderId }),
    });

    return {
      provider: 'SEPAY',
      checkoutUrl: client.checkout.initCheckoutUrl(),
      fields,
    };
  }

  async retrieveOrder(orderInvoiceNumber: string) {
    const response = await this.createClient().order.retrieve(orderInvoiceNumber);
    return response.data;
  }
}
