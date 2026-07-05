export interface Usuario {
  id?: string;
  nombreusuario: string;
  contrasena?: string;
  rol: 'ADMIN' | 'PROFESOR' | 'ESTUDIANTE';
  activo?: boolean;
}

export interface Profesor {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  fechaDeNacimiento?: string;
  correo?: string;
}

export interface Estudiante {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  fechaDeNacimiento?: string;
  correo?: string;
  grupoId?: string | null;
  nombreGrupo?: string | null;
  username?: string | null;
}

export interface Grupo {
  id: string;
  nombre: string;
  profesorIds?: string[];
  estudianteIds?: string[];
  profesores?: Profesor[];
  estudiantes?: Estudiante[];
}

export interface AsistenciaDetalle {
  estudianteId: string;
  presente: boolean;
  estudianteNombre?: string;
  estudianteApellido?: string;
}

export interface Clase {
  id: string;
  grupoId: string;
  fecha: string;
  asistencias: AsistenciaDetalle[];
}
