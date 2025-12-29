interface Tour {
  id: string;
  basePrice: number;
  minimumPrice: number;
  totalCapacity: number;
  bookedSeats: number;
  tourStartDate: Date;
}

interface PricingResult {
  newPrice: number;
  discountPercentage: number;
  discountReason: string;
}

class DynamicPricingService {
  calculateDynamicPricing(tour: Tour): PricingResult {
    const daysUntillTour = this.getDaysUntillTour(tour.tourStartDate);
    const occupancyRate = this.getOccupancyRate(
      tour.bookedSeats,
      tour.totalCapacity
    );

    const timeDiscount = this.getTimeBasedDiscount(daysUntillTour);
    const occupancyDiscount = this.getOccupancyBasedDiscount(occupancyRate);
    const combinedDiscount = this.combineDiscount(
      timeDiscount,
      occupancyDiscount,
      daysUntillTour,
      occupancyRate
    );

    let newPrice = tour.basePrice * (1 - combinedDiscount.discount / 100);
    newPrice = Math.max(newPrice, tour.minimumPrice);
    newPrice = Math.round(newPrice * 100) / 100;

    return {
      newPrice,
      discountPercentage: combinedDiscount.discount,
      discountReason: combinedDiscount.reason,
    };
  }

  private getDaysUntillTour(startDate: Date): number {
    const now = new Date();
    const start = new Date(startDate);
    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  private getOccupancyRate(booked: number, total: number): number {
    return (booked / total) * 100;
  }

  private getTimeBasedDiscount(daysUntillTour: number): {
    discount: number;
    reason: string;
  } {
    if (daysUntillTour > 60) {
      return { discount: 25, reason: "super_early_bird" };
    } else if (daysUntillTour > 30) {
      return { discount: 20, reason: "early_bird" };
    } else if (daysUntillTour > 14) {
      return { discount: 10, reason: "advance_booking" };
    } else if (daysUntillTour > 7) {
      return { discount: 5, reason: "standard" };
    } else if (daysUntillTour > 3) {
      return { discount: 15, reason: "last_week" };
    } else if (daysUntillTour >= 1) {
      return { discount: 30, reason: "same_day" };
    } else {
      return { discount: 40, reason: "same_day" };
    }
  }

  private getOccupancyBasedDiscount(occupancyRate: number): {
    discount: number;
    reason: string;
  } {
    if (occupancyRate >= 90) {
      return { discount: -10, reason: "almost_sold_out" };
    } else if (occupancyRate >= 70) {
      return { discount: 0, reason: "high_demand" };
    } else if (occupancyRate >= 40) {
      return { discount: 5, reason: "moderate_availability" };
    } else if (occupancyRate >= 20) {
      return { discount: 15, reason: "low_occupancy" };
    } else {
      return { discount: 25, reason: "very_low_occupancy" };
    }
  }

  private combineDiscount(
    timeDiscount: { discount: number; reason: string },
    occupancyDiscount: { discount: number; reason: string },
    daysUntillTour: number,
    occupancyRate: number
  ): { discount: number; reason: string } {
    if (daysUntillTour <= 3 && occupancyRate < 40) {
      return {
        discount: Math.min(
          timeDiscount.discount + occupancyDiscount.discount * 0.5,
          50
        ),
        reason: `${timeDiscount.reason}_${occupancyDiscount.reason}`,
      };
    }

    if (daysUntillTour > 30 && occupancyRate > 70) {
      return {
        discount: Math.max(timeDiscount.discount * 0.3, 0),
        reason: "popular_tour_early_bid",
      };
    }

    if (occupancyRate >= 90) {
      return {
        discount: -10,
        reason: "premium_almost_sold_out",
      };
    }

    const combinedDiscount =
      timeDiscount.discount * 0.6 + occupancyDiscount.discount * 0.4;

    return {
      discount: Math.round(combinedDiscount * 100) / 100,
      reason: `${timeDiscount.reason}_${occupancyDiscount.reason}`,
    };
  }
}

export default DynamicPricingService;
