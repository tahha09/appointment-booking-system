import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Header } from "../../../shared/components/header/header";
import { Footer } from "../../../shared/components/footer/footer";

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, Header, Footer],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {

  name = '';
  email = '';
  phone = '';
  message = '';

  // Handle form submission
  onSubmit(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched(); // show all validation errors
      return;
    }

    // Form is valid, handle backend submission later
    console.log('Form submitted:', { name: this.name, phone: this.phone, email: this.email, message: this.message });

    // Reset form after submission
    form.resetForm();
  }

}
