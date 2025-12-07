<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Seeder;

class DoctorSeeder extends Seeder
{
    public function run()
    {
        $doctors = [
            // Existing Doctors
            [
                'email' => 'ahmed185taha@Gmail.com',
                'specialization_id' => 1, // Cardiology
                'license_number' => 'MED123456',
                'experience_years' => 10,
                'consultation_fee' => 300.00,
                'biography' => 'Dr. Ahmed Taha is a renowned cardiologist with 10 years of experience in treating cardiovascular diseases. He specializes in preventive cardiology and interventional procedures.',
                'rating' => 4.8,
                'is_approved' => true,
            ],
            [
                'email' => 'doctor2@booking.com',
                'specialization_id' => 2, // Dermatology
                'license_number' => 'MED789012',
                'experience_years' => 7,
                'consultation_fee' => 250.00,
                'biography' => 'Dr. Aya Basheer specializes in dermatology and skin treatments. She has extensive experience in treating acne, eczema, and cosmetic dermatology procedures.',
                'rating' => 4.6,
                'is_approved' => true,
            ],
            [
                'email' => 'tasneemgaballah11@gmail.com',
                'specialization_id' => 3, // Neurology
                'license_number' => 'MED345678',
                'experience_years' => 8,
                'consultation_fee' => 350.00,
                'biography' => 'Dr. Tasneem Gaballah is a skilled neurologist with expertise in treating neurological disorders, headaches, and epilepsy. She is known for her compassionate approach to patient care.',
                'rating' => 4.9,
                'is_approved' => true,
            ],
            [
                'email' => 'islam.ghanem@booking.com',
                'specialization_id' => 7, // Dentistry
                'license_number' => 'MED234567',
                'experience_years' => 9,
                'consultation_fee' => 270.00,
                'biography' => 'Dr. Islam Ghanem is an experienced dentist specializing in general dentistry, cosmetic procedures, and oral surgery. He is committed to providing quality dental care with a focus on patient comfort.',
                'rating' => 4.7,
                'is_approved' => true,
            ],
            [
                'email' => 'mohamed.hassan@booking.com',
                'specialization_id' => 4, // Pediatrics
                'license_number' => 'MED456789',
                'experience_years' => 12,
                'consultation_fee' => 280.00,
                'biography' => 'Dr. Mohamed Hassan is an experienced pediatrician dedicated to children\'s health. He specializes in child development, vaccinations, and common childhood illnesses.',
                'rating' => 4.7,
                'is_approved' => true,
            ],
            [
                'email' => 'sara.ali@booking.com',
                'specialization_id' => 5, // Orthopedics
                'license_number' => 'MED567890',
                'experience_years' => 9,
                'consultation_fee' => 320.00,
                'biography' => 'Dr. Sara Ali is a board-certified orthopedic surgeon specializing in sports medicine and joint replacement. She helps patients recover from injuries and improve mobility.',
                'rating' => 4.8,
                'is_approved' => true,
            ],
            [
                'email' => 'omar.khaled@booking.com',
                'specialization_id' => 6, // Gynecology
                'license_number' => 'MED678901',
                'experience_years' => 11,
                'consultation_fee' => 290.00,
                'biography' => 'Dr. Omar Khaled is a respected gynecologist with expertise in women\'s reproductive health, prenatal care, and minimally invasive surgical procedures.',
                'rating' => 4.7,
                'is_approved' => true,
            ],
            // Additional Cardiology Doctors (Specialization 1)
            [
                'email' => 'mahmoud.ibrahim@booking.com',
                'specialization_id' => 1,
                'license_number' => 'MED123457',
                'experience_years' => 8,
                'consultation_fee' => 300.00,
                'biography' => 'Dr. Mahmoud Ibrahim specializes in interventional cardiology and heart failure management. He has extensive experience in cardiac catheterizations and pacemaker implantations.',
                'rating' => 4.7,
                'is_approved' => true,
            ],
            [
                'email' => 'nour.hassan@booking.com',
                'specialization_id' => 1,
                'license_number' => 'MED123458',
                'experience_years' => 11,
                'consultation_fee' => 310.00,
                'biography' => 'Dr. Nour Hassan is an expert in cardiac electrophysiology and arrhythmia treatment. She specializes in ablation procedures and implantable cardiac devices.',
                'rating' => 4.9,
                'is_approved' => true,
            ],
            // Additional Dermatology Doctors (Specialization 2)
            [
                'email' => 'salma.mahmoud@booking.com',
                'specialization_id' => 2,
                'license_number' => 'MED789013',
                'experience_years' => 6,
                'consultation_fee' => 250.00,
                'biography' => 'Dr. Salma Mahmoud specializes in cosmetic dermatology and laser treatments. She offers comprehensive skin care solutions including anti-aging treatments and acne management.',
                'rating' => 4.5,
                'is_approved' => true,
            ],
            [
                'email' => 'tamer.hassan@booking.com',
                'specialization_id' => 2,
                'license_number' => 'MED789014',
                'experience_years' => 9,
                'consultation_fee' => 260.00,
                'biography' => 'Dr. Tamer Hassan is experienced in medical dermatology and skin cancer screening. He provides comprehensive treatment for various skin conditions and performs dermatological surgeries.',
                'rating' => 4.6,
                'is_approved' => true,
            ],
            // Additional Neurology Doctors (Specialization 3)
            [
                'email' => 'reem.ahmed@booking.com',
                'specialization_id' => 3,
                'license_number' => 'MED345679',
                'experience_years' => 7,
                'consultation_fee' => 340.00,
                'biography' => 'Dr. Reem Ahmed specializes in headache disorders and migraine treatment. She provides comprehensive neurological care with a focus on patient education and preventive strategies.',
                'rating' => 4.8,
                'is_approved' => true,
            ],
            [
                'email' => 'khaled.mostafa@booking.com',
                'specialization_id' => 3,
                'license_number' => 'MED345680',
                'experience_years' => 13,
                'consultation_fee' => 360.00,
                'biography' => 'Dr. Khaled Mostafa is a movement disorder specialist with expertise in Parkinson\'s disease and other neurological conditions. He offers advanced treatment options including deep brain stimulation.',
                'rating' => 4.9,
                'is_approved' => true,
            ],
            // Additional Pediatrics Doctors (Specialization 4)
            [
                'email' => 'hana.ali@booking.com',
                'specialization_id' => 4,
                'license_number' => 'MED456780',
                'experience_years' => 8,
                'consultation_fee' => 275.00,
                'biography' => 'Dr. Hana Ali specializes in pediatric allergy and immunology. She provides comprehensive care for children with allergic conditions and immune system disorders.',
                'rating' => 4.7,
                'is_approved' => true,
            ],
            [
                'email' => 'wael.mahmoud@booking.com',
                'specialization_id' => 4,
                'license_number' => 'MED456781',
                'experience_years' => 10,
                'consultation_fee' => 285.00,
                'biography' => 'Dr. Wael Mahmoud is a pediatric cardiologist specializing in congenital heart defects and acquired heart conditions in children. He provides comprehensive cardiac care for young patients.',
                'rating' => 4.8,
                'is_approved' => true,
            ],
            // Additional Orthopedics Doctors (Specialization 5)
            [
                'email' => 'mona.ibrahim@booking.com',
                'specialization_id' => 5,
                'license_number' => 'MED567891',
                'experience_years' => 12,
                'consultation_fee' => 325.00,
                'biography' => 'Dr. Mona Ibrahim specializes in sports medicine and arthroscopic surgery. She helps athletes and active individuals recover from injuries and optimize performance.',
                'rating' => 4.7,
                'is_approved' => true,
            ],
            [
                'email' => 'hassan.ali@booking.com',
                'specialization_id' => 5,
                'license_number' => 'MED567892',
                'experience_years' => 15,
                'consultation_fee' => 330.00,
                'biography' => 'Dr. Hassan Ali is an orthopedic trauma surgeon with extensive experience in complex fracture repair and reconstructive surgery. He specializes in limb salvage procedures.',
                'rating' => 4.8,
                'is_approved' => true,
            ],
            // Additional Gynecology Doctors (Specialization 6)
            [
                'email' => 'laila.mahmoud@booking.com',
                'specialization_id' => 6,
                'license_number' => 'MED678902',
                'experience_years' => 9,
                'consultation_fee' => 285.00,
                'biography' => 'Dr. Laila Mahmoud specializes in reproductive endocrinology and infertility. She provides comprehensive fertility treatment and reproductive health care for women.',
                'rating' => 4.6,
                'is_approved' => true,
            ],
            [
                'email' => 'amira.hassan@booking.com',
                'specialization_id' => 6,
                'license_number' => 'MED678903',
                'experience_years' => 7,
                'consultation_fee' => 280.00,
                'biography' => 'Dr. Amira Hassan is a gynecologic oncologist specializing in women\'s cancer care. She provides comprehensive treatment for gynecological malignancies with a compassionate approach.',
                'rating' => 4.9,
                'is_approved' => true,
            ],
            // Additional Dentistry Doctors (Specialization 7)
            [
                'email' => 'youssef.ahmed@booking.com',
                'specialization_id' => 7,
                'license_number' => 'MED234568',
                'experience_years' => 11,
                'consultation_fee' => 275.00,
                'biography' => 'Dr. Youssef Ahmed is an oral surgeon specializing in dental implants and complex extractions. He provides comprehensive oral surgery services with advanced techniques.',
                'rating' => 4.8,
                'is_approved' => true,
            ],
            [
                'email' => 'dina.mostafa@booking.com',
                'specialization_id' => 7,
                'license_number' => 'MED234569',
                'experience_years' => 6,
                'consultation_fee' => 265.00,
                'biography' => 'Dr. Dina Mostafa specializes in pediatric dentistry and orthodontics. She creates a comfortable environment for children and provides comprehensive dental care from infancy through adolescence.',
                'rating' => 4.7,
                'is_approved' => true,
            ],
            // Psychiatry Doctors (Specialization 8)
            [
                'email' => 'ahmed.mostafa@booking.com',
                'specialization_id' => 8,
                'license_number' => 'MED890123',
                'experience_years' => 14,
                'consultation_fee' => 200.00,
                'biography' => 'Dr. Ahmed Mostafa is a psychiatrist specializing in mood disorders and psychotherapy. He provides comprehensive mental health care with a focus on evidence-based treatments.',
                'rating' => 4.6,
                'is_approved' => true,
            ],
            [
                'email' => 'fatma.hassan@booking.com',
                'specialization_id' => 8,
                'license_number' => 'MED890124',
                'experience_years' => 9,
                'consultation_fee' => 195.00,
                'biography' => 'Dr. Fatma Hassan specializes in child and adolescent psychiatry. She helps young patients navigate mental health challenges and provides family-centered care.',
                'rating' => 4.8,
                'is_approved' => true,
            ],
            [
                'email' => 'kareem.ali@booking.com',
                'specialization_id' => 8,
                'license_number' => 'MED890125',
                'experience_years' => 11,
                'consultation_fee' => 210.00,
                'biography' => 'Dr. Kareem Ali is an addiction psychiatrist with expertise in substance use disorders. He provides comprehensive treatment including medication management and counseling.',
                'rating' => 4.7,
                'is_approved' => true,
            ],
            // Ophthalmology Doctors (Specialization 9)
            [
                'email' => 'samira.mahmoud@booking.com',
                'specialization_id' => 9,
                'license_number' => 'MED901234',
                'experience_years' => 10,
                'consultation_fee' => 250.00,
                'biography' => 'Dr. Samira Mahmoud is a comprehensive ophthalmologist specializing in cataract surgery and glaucoma management. She provides complete eye care services.',
                'rating' => 4.7,
                'is_approved' => true,
            ],
            [
                'email' => 'omar.ibrahim@booking.com',
                'specialization_id' => 9,
                'license_number' => 'MED901235',
                'experience_years' => 8,
                'consultation_fee' => 245.00,
                'biography' => 'Dr. Omar Ibrahim specializes in refractive surgery and corneal diseases. He performs LASIK and other vision correction procedures with advanced technology.',
                'rating' => 4.8,
                'is_approved' => true,
            ],
            [
                'email' => 'nour.ahmed@booking.com',
                'specialization_id' => 9,
                'license_number' => 'MED901236',
                'experience_years' => 12,
                'consultation_fee' => 255.00,
                'biography' => 'Dr. Nour Ahmed is a retina specialist treating diabetic retinopathy and macular degeneration. She provides advanced treatments including intravitreal injections.',
                'rating' => 4.9,
                'is_approved' => true,
            ],
            // General Practice Doctors (Specialization 10)
            [
                'email' => 'mohamed.ali@booking.com',
                'specialization_id' => 10,
                'license_number' => 'MED012345',
                'experience_years' => 16,
                'consultation_fee' => 150.00,
                'biography' => 'Dr. Mohamed Ali is a family physician providing comprehensive primary care. He emphasizes preventive medicine and chronic disease management.',
                'rating' => 4.5,
                'is_approved' => true,
            ],
            [
                'email' => 'amina.hassan@booking.com',
                'specialization_id' => 10,
                'license_number' => 'MED012346',
                'experience_years' => 13,
                'consultation_fee' => 145.00,
                'biography' => 'Dr. Amina Hassan specializes in geriatric care and women\'s health. She provides compassionate care for patients of all ages with a focus on preventive health.',
                'rating' => 4.6,
                'is_approved' => true,
            ],
            [
                'email' => 'tarek.mahmoud@booking.com',
                'specialization_id' => 10,
                'license_number' => 'MED012347',
                'experience_years' => 18,
                'consultation_fee' => 155.00,
                'biography' => 'Dr. Tarek Mahmoud is an experienced general practitioner with expertise in chronic disease management and health screenings. He provides comprehensive primary care services.',
                'rating' => 4.7,
                'is_approved' => true,
            ],
        ];

        foreach ($doctors as $doctorData) {
            $user = User::where('email', $doctorData['email'])->first();
            if ($user) {
                Doctor::create([
                    'user_id' => $user->id,
                    'specialization_id' => $doctorData['specialization_id'],
                    'license_number' => $doctorData['license_number'],
                    'experience_years' => $doctorData['experience_years'],
                    'consultation_fee' => $doctorData['consultation_fee'],
                    'biography' => $doctorData['biography'],
                    'rating' => $doctorData['rating'],
                    'is_approved' => $doctorData['is_approved'],
                ]);
            }
        }
    }
}
