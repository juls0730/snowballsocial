import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import Swal from "sweetalert2";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler) {
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {
                let errorMessage = "An Unknown Error Occurred!"
                if (error.statusText) {
                    errorMessage = error.statusText;
                }
                if (error.error.message) {
                    errorMessage = error.error.message;
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