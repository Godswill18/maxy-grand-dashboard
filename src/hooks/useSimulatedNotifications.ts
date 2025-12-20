// import { useEffect } from 'react';
// import { useNotifications } from '@/contexts/NotificationContext';

// export const useSimulatedNotifications = () => {
//   // const { addNotification } = useNotifications();

//   useEffect(() => {
//     const notifications = [
//       {
//         type: 'booking' as const,
//         title: 'New Booking',
//         message: 'Room 305 has been booked by John Smith for 3 nights',
//         metadata: { room: '305', guest: 'John Smith' },
//       },
//       {
//         type: 'checkin' as const,
//         title: 'Guest Check-in',
//         message: 'Sarah Johnson checked in to Room 201',
//         metadata: { room: '201', guest: 'Sarah Johnson' },
//       },
//       {
//         type: 'payment' as const,
//         title: 'Payment Confirmed',
//         message: 'Payment of $450 received for booking #1234',
//         metadata: { amount: 450, bookingId: '1234' },
//       },
//       {
//         type: 'cleaning_task' as const,
//         title: 'Cleaning Task',
//         message: 'Room 102 requires immediate cleaning',
//         metadata: { room: '102', priority: 'high' },
//       },
//     ];

//     const intervals: NodeJS.Timeout[] = [];

//     // Simulate notifications at different intervals
//     notifications.forEach((notif, index) => {
//       const interval = setInterval(() => {
//         addNotification(notif);
//       }, (index + 1) * 45000); // 45s, 90s, 135s, 180s

//       intervals.push(interval);
//     });

//     return () => {
//       intervals.forEach(clearInterval);
//     };
//   }, [addNotification]);
// };
