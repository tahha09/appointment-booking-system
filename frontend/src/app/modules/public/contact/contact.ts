import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
