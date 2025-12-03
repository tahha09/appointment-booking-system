import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Header } from "../../../shared/components/header/header";
import { Footer } from "../../../shared/components/footer/footer";
import { Email } from '../../../core/services/email';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, Header, Footer],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {

  constructor(private emailService: Email, private cd: ChangeDetectorRef) {}
  name = '';
  email = '';
  phone = '';
  message = '';

  successMessage = '';
  errorMessage = '';

  // Handle form submission
  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched(); // show all validation errors
      return;
    }
    const formData = {
    name: this.name,
    email: this.email,
    phone: this.phone,
    message: this.message
   };

    // Form is valid, handle backend submission later
    // console.log('Form submitted:', { name: this.name, phone: this.phone, email: this.email, message: this.message });


    this.emailService.sendEmail(formData).subscribe({
    next: (res) => {
      this.successMessage = res.success;
      this.errorMessage = '';
      form.resetForm();

      setTimeout(() => {
          this.successMessage = '';
          this.cd.detectChanges();
        }, 5000);
    },
    error: (err) => {
      this.errorMessage = 'there is an error during send message';
      this.successMessage = '';

      setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
    }
  });
  }

}
