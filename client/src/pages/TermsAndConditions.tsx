import React from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function TermsAndConditions() {
  return (
    <>
    <Navigation/>
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>

      <p className="text-gray-600 mb-8">
        Last Updated: January 1, 2024
      </p>

      <div className="space-y-8">

        <section>
          <h2 className="text-2xl font-semibold mb-3">d
            Guest Cancellation & Refund Policy
          </h2>

          <p>
            At Luxarna Hotel, we understand that travel plans can change.
            Our cancellation and refund policy is designed to provide
            reasonable flexibility to guests while protecting the hotel
            from losses caused by cancelled or shortened stays.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            1. Standard Reservations
          </h3>

          <h4 className="font-medium mt-4">
            Cancellation 48 hours or more before arrival
          </h4>

          <p>
            Guests may cancel their reservation at least 48 hours before
            the scheduled check-in date without an accommodation
            cancellation penalty.
          </p>

          <p>
            Where a deposit has already been paid, the refundable amount
            will be returned less applicable administrative and
            third-party payment-processing charges.
          </p>

          <h4 className="font-medium mt-4">
            Cancellation less than 48 hours before arrival
          </h4>

          <p>
            A cancellation made less than 48 hours before the scheduled
            check-in time will attract a cancellation charge equivalent
            to one night's room rate.
          </p>

          <p>
            Any remaining eligible balance may be refunded after
            deduction of applicable charges.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">2. No-Show</h3>

          <p>
            If a guest does not arrive on the scheduled arrival date and
            does not cancel the reservation:
          </p>

          <ul className="list-disc ml-6 mt-2">
            <li>The reservation will be treated as a no-show.</li>
            <li>
              A charge equivalent to one night's accommodation will apply
              for standard reservations.
            </li>
            <li>
              Any remaining prepaid balance, where applicable, may be
              refunded after deduction of applicable charges.
            </li>
          </ul>

          <p className="mt-3">
            Where the reservation has a different cancellation/no-show
            condition, the terms applicable to that reservation will
            prevail.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            3. Early Departure
          </h3>

          <p>
            Guests who decide to leave before their confirmed departure
            date must notify the hotel as soon as possible.
          </p>

          <p>
            Payment for unused nights is not automatically refundable.
          </p>

          <p>Where a refund is approved, Luxarna may deduct:</p>

          <ul className="list-disc ml-6 mt-2">
            <li>Applicable cancellation charges;</li>
            <li>Administrative charges; and</li>
            <li>Third-party/payment-processing fees.</li>
          </ul>

          <p className="mt-3">
            Management may waive or reduce these charges at its
            discretion, particularly where sufficient notice is provided
            and the room can be resold.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            4. Refunds on Deposits
          </h3>

          <p>
            Where a refundable deposit has been paid, the refund will be
            calculated as follows:
          </p>

          <div className="bg-gray-100 p-4 rounded-lg mt-3 mb-3">
            Refundable Deposit − Applicable Cancellation Charge −
            Administrative Charge − Non-refundable Payment/Third-Party
            Charges = Net Refund
          </div>

          <p>
            Unless otherwise stated on the booking confirmation, Luxarna
            may apply an administrative charge of 10% of the refundable
            amount.
          </p>

          <p>
            Any payment-processing or third-party charges already
            incurred may also be deducted where applicable.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            5. Non-Refundable Rates
          </h3>

          <p>
            Reservations booked under a non-refundable rate or
            promotional offer are not eligible for a refund following
            cancellation, no-show, or early departure, except where
            required by applicable law or expressly approved by Luxarna
            management.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            6. Booking.com and Other Online Travel Agencies
          </h3>

          <p>
            Reservations made through Booking.com or another online
            travel platform are subject to the cancellation and payment
            conditions displayed to the guest at the time of booking.
          </p>

          <p>
            Guests should initiate cancellations or modifications through
            the platform where possible.
          </p>

          <p>
            Where the platform has already collected payment from the
            guest, any refund will be handled in accordance with the
            platform's applicable procedures and the terms of the
            reservation.
          </p>

          <p>
            Luxarna may approve a cancellation-fee waiver where
            circumstances justify it, but such approval does not
            automatically guarantee that the third-party platform will
            issue a refund.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            7. Direct Bookings
          </h3>

          <p>
            For reservations made directly with Luxarna, the cancellation
            and refund conditions communicated at the time of booking
            will apply.
          </p>

          <p>
            Guests requesting cancellation should contact Luxarna through
            the hotel's official telephone, WhatsApp, email, or other
            approved communication channel.
          </p>

          <p>
            A cancellation is considered effective only when
            acknowledged or recorded by Luxarna.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            8. Long-Stay and Corporate Reservations
          </h3>

          <p>
            Reservations of 7 nights or more, corporate accommodation
            agreements, group bookings, and special-event reservations
            may be subject to separate cancellation terms.
          </p>

          <p>
            These terms will be communicated to the guest or corporate
            client before confirmation.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            9. Special Circumstances
          </h3>

          <p>
            Luxarna may consider exceptions for genuine emergencies or
            exceptional circumstances on a case-by-case basis.
          </p>

          <p>Supporting documentation may be requested.</p>

          <p>
            Approval of an exception is at the discretion of management
            and does not establish a precedent for future reservations.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            10. Refund Processing
          </h3>

          <p>
            Approved refunds will normally be processed within 7–14
            business days, depending on the payment method and financial
            institution.
          </p>

          <p>
            The actual time for funds to reach the guest may vary
            according to the payment provider or bank.
          </p>

          <p>
            Refunds will normally be returned through the original
            payment method where practicable.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            11. Room Resale and Discretionary Refunds
          </h3>

          <p>
            Where a guest cancels after the free-cancellation period but
            the hotel successfully resells the room for the affected
            night(s), management may, at its discretion, reduce or waive
            the applicable cancellation charge.
          </p>

          <p>
            This is a discretionary goodwill provision and is not
            guaranteed.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2">
            12. Acceptance
          </h3>

          <p>
            By confirming a reservation, the guest acknowledges that
            they have read and accepted the cancellation and refund
            conditions applicable to their booking.
          </p>

          <p>
            Luxarna Hotel reserves the right to apply different terms
            where those terms were expressly communicated and accepted at
            the time of booking.
          </p>
        </section>

        <section className="border-t pt-6">
          <h2 className="text-2xl font-semibold mb-3">
            LUXARNA HOTEL
          </h2>

          <p>
            Management reserves the right to review individual cases
            based on the circumstances of each reservation.
          </p>
        </section>

      </div>
    </div>
    <Footer/>
    </>
  );
}