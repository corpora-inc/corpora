use clap::Args;

/// Arguments for the `label` subcommand
#[derive(Args)]
pub struct LabelArgs {
    #[arg(help = "ID of the issue to label")]
    pub id: u32,
}

/// Run the `label` subcommand
pub fn run(args: LabelArgs) {
    println!("Labeling issue with ID: {}", args.id);
}
