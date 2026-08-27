import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import {
  HTTP_INTERCEPTORS,
  HttpClientModule
} from '@angular/common/http';

import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import { AuthInterceptor } from './services/auth.interceptor';

/* =========================================================
   COMPONENTS
   ========================================================= */

import {
  AdminViewDriversComponent
} from './components/admin-view-drivers/admin-view-drivers.component';

import {
  AdminnavComponent
} from './components/adminnav/adminnav.component';

import {
  AdminviewfeedbackComponent
} from './components/adminviewfeedback/adminviewfeedback.component';

import {
  AdminviewrequestsComponent
} from './components/adminviewrequests/adminviewrequests.component';

import {
  AuthguardComponent
} from './components/authguard/authguard.component';

import {
  CustomerRequestComponent
} from './components/customer-request/customer-request.component';

import {
  CustomernavComponent
} from './components/customernav/customernav.component';

import {
  DriverManagementComponent
} from './components/driver-management/driver-management.component';

import {
  ErrorComponent
} from './components/error/error.component';

import {
  HomePageComponent
} from './components/home-page/home-page.component';

import {
  LoginComponent
} from './components/login/login.component';

import {
  SignupComponent
} from './components/signup/signup.component';

import {
  CustomerpostfeedbackComponent
} from './components/customerpostfeedback/customerpostfeedback.component';

import {
  CustomerviewdriverComponent
} from './components/customerviewdriver/customerviewdriver.component';

import {
  CustomerviewfeedbackComponent
} from './components/customerviewfeedback/customerviewfeedback.component';



import {
  AdminHomeComponent
} from './components/admin-home/admin-home.component';

/* =========================================================
   LUCIDE ANGULAR ICONS
   ========================================================= */

import {
  LucideAngularModule,

  /* Existing application icons */
  MessageSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  TriangleAlert,
  List,
  Star,
  PenLine,
  CalendarClock,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Timer,
  Search,
  Plus,
  Minus,
  User,
  Car,
  MapPinned,
  CreditCard,
  Phone,
  Mail,
  Check,
  X,

  /* Customer home and navigation icons */
  Map,
  Maximize2,
  Sparkles,
  Compass,
  House,
  ClipboardList,
  Sun,
  Moon,
  LogOut,

  /* Admin dashboard icons */
  Activity,
  ArrowUpRight,
  CalendarDays,
  CarFront,
  ClipboardCheck,
  Clock3,
  MessageCircle,
  MessageSquareText,
  TrendingUp,
  TrendingDown,
  UserPlus,
  Users,
  Zap,

  /* Driver Management icons */
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CircleAlert,
  CircleCheck,
  CircleDot,
  Contact,
  FileImage,
  HardDriveUpload,
  Image,
  ImagePlus,
  IndianRupee,
  Info,
  LoaderCircle,
  RefreshCw,
  Save,
  ShieldCheck,
  SquarePen,
  Trash2,
  UploadCloud,
  UserRoundPlus,
  ScanLine,

  /* Admin requests, drivers and feedback icons */
  CircleX,
  Flag,
  ArrowUpDown,
  FileText,
  UserRoundSearch,
  Route,
  Power,
  UserRound,

  /* Alerts for error page */
  LogIn,
  Home
} from 'lucide-angular';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { CustomerviewrequestedComponent } from './components/customerviewrequested/customerviewrequested.component';

@NgModule({
  declarations: [
    AppComponent,
    AdminViewDriversComponent,
    AdminnavComponent,
    AdminviewfeedbackComponent,
    AdminviewrequestsComponent,
    AuthguardComponent,
    CustomerRequestComponent,
    CustomernavComponent,
    CustomerpostfeedbackComponent,   
    CustomerviewdriverComponent,
    CustomerviewfeedbackComponent,
    CustomerviewrequestedComponent,
    DriverManagementComponent,
    ErrorComponent,
    HomePageComponent,
    LoginComponent,
    SignupComponent,
    AdminHomeComponent,
    ChatbotComponent
  ],

  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,

    LucideAngularModule.pick({
      /* Existing application icons */
      MessageSquare,
      ScanLine,
      ChevronDown,
      ChevronLeft,
      ChevronRight,
      AlertCircle,
      TriangleAlert,
      List,
      Star,
      PenLine,
      CalendarClock,
      Calendar,
      Clock,
      MapPin,
      Navigation,
      Timer,
      Search,
      Plus,
      Minus,
      User,
      Car,
      MapPinned,
      CreditCard,
      Phone,
      Mail,
      Check,
      X,

      /* Customer home and navigation icons */
      Map,
      Maximize2,
      Sparkles,
      Compass,
      House,
      ClipboardList,
      Sun,
      Moon,
      LogOut,

      /* Admin dashboard icons */
      Activity,
      ArrowUpRight,
      CalendarDays,
      CarFront,
      ClipboardCheck,
      Clock3,
      MessageCircle,
      MessageSquareText,
      TrendingUp,
      TrendingDown,
      UserPlus,
      Users,
      Zap,

      /* Driver Management icons */
      ArrowLeft,
      BadgeCheck,
      BriefcaseBusiness,
      CircleAlert,
      CircleCheck,
      CircleDot,
      Contact,
      FileImage,
      HardDriveUpload,
      Image,
      ImagePlus,
      IndianRupee,
      Info,
      LoaderCircle,
      RefreshCw,
      Save,
      ShieldCheck,
      SquarePen,
      Trash2,
      UploadCloud,
      UserRoundPlus,

      /* Admin requests, drivers and feedback icons */
      CircleX,
      Flag,
      ArrowUpDown,
      FileText,
      UserRoundSearch,
      Route,
      Power,
      UserRound
    })
  ],

  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],

  bootstrap: [
    AppComponent
  ]
})
export class AppModule {}