<?php

namespace Database\Seeders;

use App\Models\Specialization;
use Illuminate\Database\Seeder;

class SpecializationSeeder extends Seeder
{
    public function run()
    {
        $specializations = [
            [
                'name' => 'Cardiology',
                'description' => 'Heart and cardiovascular system specialist',
                'common_conditions' => 'Heart disease, hypertension, arrhythmias, heart attacks, heart failure, coronary artery disease, valve disorders',
                'procedures' => 'ECG, echocardiography, cardiac catheterization, angioplasty, pacemaker implantation, cardiac surgery, stress testing',
                'when_to_see' => 'Chest pain, shortness of breath, palpitations, high blood pressure, family history of heart disease, dizziness, fainting',
                'emergency_signs' => 'Severe chest pain, difficulty breathing, sudden weakness, loss of consciousness',
                'preparation_tips' => 'Bring list of medications, family history of heart disease, previous test results',
                'typical_duration' => 30,
                'avg_cost' => 300.00
            ],
            [
                'name' => 'Dermatology',
                'description' => 'Skin, hair, and nail specialist',
                'common_conditions' => 'Acne, eczema, psoriasis, skin cancer, hair loss, nail infections, dermatitis, warts, moles',
                'procedures' => 'Skin biopsies, laser treatments, chemical peels, cosmetic injections, mole removal, skin cancer screening',
                'when_to_see' => 'Skin rashes, unusual moles, hair loss, chronic skin conditions, cosmetic concerns, suspicious skin changes',
                'emergency_signs' => 'Severe allergic reactions, infected wounds, rapidly changing moles',
                'preparation_tips' => 'Avoid sun exposure before visit, bring list of skin products used, note when symptoms started',
                'typical_duration' => 20,
                'avg_cost' => 250.00
            ],
            [
                'name' => 'Neurology',
                'description' => 'Brain and nervous system specialist',
                'common_conditions' => 'Headaches, epilepsy, stroke, Parkinson\'s disease, multiple sclerosis, neuropathy, migraines, seizures',
                'procedures' => 'EEG, MRI, CT scans, nerve conduction studies, lumbar puncture, neurological examination',
                'when_to_see' => 'Severe headaches, seizures, numbness, weakness, coordination problems, memory issues, dizziness',
                'emergency_signs' => 'Sudden severe headache, loss of consciousness, paralysis, confusion, stroke symptoms',
                'preparation_tips' => 'Keep headache diary, note seizure frequency, bring list of current medications',
                'typical_duration' => 45,
                'avg_cost' => 350.00
            ],
            [
                'name' => 'Pediatrics',
                'description' => 'Child healthcare specialist',
                'common_conditions' => 'Childhood illnesses, developmental delays, growth issues, vaccinations, infections, allergies',
                'procedures' => 'Well-child exams, vaccinations, developmental screenings, minor surgical procedures, hearing/vision screening',
                'when_to_see' => 'Regular check-ups, illness in children, developmental concerns, vaccination schedules, growth monitoring',
                'emergency_signs' => 'High fever in infants, difficulty breathing, severe dehydration, persistent vomiting',
                'preparation_tips' => 'Bring vaccination records, growth charts, note developmental milestones',
                'typical_duration' => 25,
                'avg_cost' => 280.00
            ],
            [
                'name' => 'Orthopedics',
                'description' => 'Bones and joints specialist',
                'common_conditions' => 'Fractures, arthritis, sports injuries, back pain, joint pain, bone deformities, tendon injuries',
                'procedures' => 'X-rays, MRI, joint injections, fracture repair, joint replacement, physical therapy, arthroscopy',
                'when_to_see' => 'Bone fractures, joint pain, sports injuries, chronic pain, mobility issues, bone deformities',
                'emergency_signs' => 'Open fractures, severe pain, inability to move limb, suspected spinal injury',
                'preparation_tips' => 'Bring previous X-rays, describe injury mechanism, note pain levels and limitations',
                'typical_duration' => 30,
                'avg_cost' => 320.00
            ],
            [
                'name' => 'Gynecology',
                'description' => 'Female reproductive system specialist',
                'common_conditions' => 'Menstrual disorders, pregnancy, infertility, menopause, reproductive cancers, pelvic pain',
                'procedures' => 'Pap smears, pelvic exams, ultrasounds, hysteroscopy, laparoscopy, prenatal care, contraception counseling',
                'when_to_see' => 'Pregnancy, menstrual issues, infertility concerns, menopause symptoms, reproductive health screening',
                'emergency_signs' => 'Severe pelvic pain, heavy bleeding, pregnancy complications, suspected ectopic pregnancy',
                'preparation_tips' => 'Schedule during non-menstrual period, bring menstrual history, prepare questions about contraception',
                'typical_duration' => 30,
                'avg_cost' => 290.00
            ],
            [
                'name' => 'Dentistry',
                'description' => 'Teeth and oral health specialist',
                'common_conditions' => 'Tooth decay, gum disease, oral cancer, tooth loss, jaw disorders, dental infections',
                'procedures' => 'Cleanings, fillings, root canals, extractions, dental implants, orthodontic treatments, oral surgery',
                'when_to_see' => 'Tooth pain, regular cleanings, dental emergencies, cosmetic dentistry needs, oral health concerns',
                'emergency_signs' => 'Severe tooth pain, dental trauma, oral bleeding, facial swelling',
                'preparation_tips' => 'Brush teeth before visit, bring dental history, inform about dental anxiety',
                'typical_duration' => 60,
                'avg_cost' => 270.00
            ],
            [
                'name' => 'Psychiatry',
                'description' => 'Mental health specialist',
                'common_conditions' => 'Depression, anxiety, bipolar disorder, schizophrenia, PTSD, ADHD, eating disorders',
                'procedures' => 'Psychiatric evaluations, medication management, therapy, counseling, psychological testing',
                'when_to_see' => 'Mental health concerns, emotional difficulties, behavioral issues, medication management, therapy needs',
                'emergency_signs' => 'Suicidal thoughts, severe depression, psychotic episodes, harm to self or others',
                'preparation_tips' => 'Prepare list of symptoms, note when they started, bring previous treatment history',
                'typical_duration' => 50,
                'avg_cost' => 200.00
            ],
            [
                'name' => 'Ophthalmology',
                'description' => 'Eye and vision specialist',
                'common_conditions' => 'Vision problems, cataracts, glaucoma, macular degeneration, eye injuries, diabetic retinopathy',
                'procedures' => 'Eye exams, cataract surgery, LASIK, glaucoma treatment, retinal procedures, vision correction',
                'when_to_see' => 'Vision changes, eye pain, regular eye exams, eye injuries, family history of eye disease',
                'emergency_signs' => 'Sudden vision loss, eye trauma, severe eye pain, flashes/floaters with vision loss',
                'preparation_tips' => 'Bring current glasses, note vision changes, inform about allergies to eye drops',
                'typical_duration' => 40,
                'avg_cost' => 250.00
            ],
            [
                'name' => 'General Practice',
                'description' => 'Primary care physician',
                'common_conditions' => 'General health concerns, preventive care, minor illnesses, chronic disease management, health screening',
                'procedures' => 'Physical exams, vaccinations, health screenings, minor procedures, referrals, chronic disease management',
                'when_to_see' => 'Routine check-ups, general health concerns, preventive care, initial consultations, health maintenance',
                'emergency_signs' => 'Severe pain, difficulty breathing, chest pain, confusion, high fever',
                'preparation_tips' => 'Bring medication list, prepare questions, bring previous test results',
                'typical_duration' => 20,
                'avg_cost' => 150.00
            ],
        ];

        foreach ($specializations as $specialization) {
            Specialization::create($specialization);
        }
    }
}
