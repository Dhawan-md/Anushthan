import { Service } from "typedi";
import { Repository } from "typeorm";
import { Booking } from "../../entities/Booking";
import { RepositoryFactory } from "../../factories/RepositoryFactory";
import { PanditDashboardResponse } from "../../types/responses/PanditDashboardResponse";
import { BookingStatus } from "../../utils/enums";

@Service()
export class PanditDashboardService {
  private bookingRepository: Repository<Booking>;

  constructor(private repositoryFactory: RepositoryFactory) {
    this.bookingRepository = this.repositoryFactory.getRepository(Booking);
  }

  async getDashboardStats(panditId: string): Promise<PanditDashboardResponse> {
    const bookings = await this.bookingRepository.find({
      where: { panditId }
    });

    let totalEarnings = 0;
    let completedBookings = 0;
    let pendingBookings = 0;

    for (const b of bookings) {
      if (b.status === BookingStatus.COMPLETED) {
        completedBookings++;
        if (b.paid) {
          totalEarnings += Number(b.totalPrice || 0);
        }
      } else if (b.status === BookingStatus.PENDING || b.status === BookingStatus.ACCEPTED) {
        pendingBookings++;
      }
    }

    return new PanditDashboardResponse(true, "Dashboard stats fetched successfully", {
      totalEarnings,
      totalBookings: bookings.length,
      completedBookings,
      pendingBookings
    });
  }
}
