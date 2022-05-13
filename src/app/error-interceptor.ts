import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from "@angular/common/http";
import { Injectable, NgModule } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import Swal from "sweetalert2";
import { ErrorComponent } from "./error/error.component";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler) {
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                let errorMessage = "An Unknown Error Occurred!"
                if (error.statusText) {
                    errorMessage = error.statusText;
                    console.log(errorMessage);
                }
                if (error.error.message) {
                    errorMessage = error.error.message;
                    console.log(errorMessage);
                }
                Swal.fire({
                    title: "An Error Occurred!",
                    text: errorMessage,
                    icon: "error",
                    confirmButtonText: "OK"
                });
                return throwError(error);
            })
        );
    }
}  