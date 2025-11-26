import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Header, Footer, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  readonly locations = ['Chicago', 'Los Angeles', 'New York'];

  readonly heroStats = [
    { label: 'Happy Patients', value: '95k+' },
    { label: 'Expert Doctors', value: '1.2k+' },
    { label: 'Cities Covered', value: '180+' },
  ];

  readonly specialities = [
    {
      name: 'Cardiologist',
      description: 'Heart & vascular specialists for proactive care.',
      accent: 'from-rose-500 to-rose-600',
    },
    {
      name: 'Dentist',
      description: 'Comprehensive dental care and smile design.',
      accent: 'from-amber-500 to-orange-500',
    },
    {
      name: 'Laboratory',
      description: 'Fast, reliable diagnostics and lab testing.',
      accent: 'from-emerald-500 to-green-600',
    },
    {
      name: 'Neurology',
      description: 'Advanced brain and nervous system care.',
      accent: 'from-indigo-500 to-blue-600',
    },
    {
      name: 'Ophthalmology',
      description: 'Eye health and vision correction experts.',
      accent: 'from-sky-500 to-cyan-500',
    },
    {
      name: 'Orthopedic',
      description: 'Bone, joint, and sports injury treatments.',
      accent: 'from-violet-500 to-purple-600',
    },
  ];

  readonly doctors = [
    {
      name: 'Dr Ruby Perrin',
      initials: 'RP',
      specialty: 'Dentist',
      rating: 4.67,
      reviews: 3,
      price: '$200.00',
      availability: 'Available Today',
    },
    {
      name: 'Darren Elder',
      initials: 'DE',
      specialty: 'Cardiologist',
      rating: 4.67,
      reviews: 3,
      price: '$0.00',
      availability: 'Next slot 2:30 PM',
    },
    {
      name: 'Saeed Tamer',
      initials: 'ST',
      specialty: 'Cardiologist',
      rating: 0,
      reviews: 0,
      price: '$0.00',
      availability: 'Slots open tomorrow',
    },
  ];

  readonly faqs = [
    {
      question: 'How do I book an appointment with a doctor?',
      answer:
        'Visit the platform, log in or create an account, search by specialization, location, or availability, then confirm your booking in a few clicks.',
    },
    {
      question: 'Can I request a specific doctor when booking?',
      answer:
        'Yes. Choose your preferred doctor while booking. Final confirmation depends on the doctor’s schedule and availability.',
    },
    {
      question: 'What should I do if I need to cancel or reschedule?',
      answer:
        'Contact the doctor or clinic as early as possible so they can help you reschedule or reopen the slot for other patients.',
    },
    {
      question: "What if I'm running late for my appointment?",
      answer:
        'Let the doctor’s office know. Many clinics can accommodate slight delays or quickly help you secure another time.',
    },
    {
      question: 'Can I book for family members or dependents?',
      answer:
        'Absolutely. Add their details during booking and provide the necessary consent so the doctor has the right information.',
    },
  ];

  readonly steps = [
    {
      title: 'Search Doctor',
      description: 'Filter by specialization, city, availability, or experience in seconds.',
    },
    {
      title: 'Check Doctor Profile',
      description: 'Review qualifications, patient feedback, fees, and clinic photos.',
    },
    {
      title: 'Schedule Appointment',
      description: 'Pick a slot that fits your calendar and confirm instantly.',
    },
    {
      title: 'Get Your Solution',
      description: 'Discuss symptoms, receive personalized treatment, and follow-up plans.',
    },
  ];

  readonly articles = [
    {
      title: 'Doccure – Making your clinic painless visit?',
      author: 'admin',
      date: '18 Jul 2023',
      excerpt: 'Explore the benefits & challenges of virtual healthcare appointments.',
    },
    {
      title: 'Benefits of Consulting With an Online Doctor',
      author: 'admin',
      date: '28 Sep 2021',
      excerpt: 'Uncover strategies to balance professional and personal wellness.',
    },
    {
      title: 'What are the benefits of online doctor booking',
      author: 'admin',
      date: '28 Sep 2021',
      excerpt: 'Learn why digital-first care improves sleep, habits, and outcomes.',
    },
    {
      title: '5 great reasons to use an online doctor to choose',
      author: 'admin',
      date: '25 Sep 2021',
      excerpt: 'See how digital life impacts mental health and how to stay resilient.',
    },
  ];

  readonly testimonials = [
    {
      name: 'Jennifer Robinson',
      location: 'LELAND, USA',
      quote:
        'It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.',
    },
    {
      name: 'Denise Stevens',
      location: 'ABINGTON, USA',
      quote:
        'The platform made it effortless to find the right specialist. Reminders and follow-ups kept me on track.',
    },
    {
      name: 'Charles Ortega',
      location: 'EL PASO, USA',
      quote:
        'Every visit feels coordinated and personal—the UI is intuitive and the doctors are outstanding.',
    },
  ];

  readonly partners = ['partners', 'partners', 'partners', 'partners', 'partners', 'partners'];
}
