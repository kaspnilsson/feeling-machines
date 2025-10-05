/**
 * Type definitions for jstat
 * Minimal type definitions for the statistical functions we use
 */

declare module "jstat" {
  interface StudentT {
    cdf(x: number, df: number): number;
  }

  interface CentralF {
    cdf(x: number, df1: number, df2: number): number;
  }

  interface JStatStatic {
    studentt: StudentT;
    centralF: CentralF;
  }

  const jStat: JStatStatic;
  export default jStat;
}
